import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CommentDto, ErrorCode, HASHTAG_REGEX, HashtagDto, MEDIA_RULES, PaginationQuery, PostDto } from '@repo/shared';
import { badRequest, forbidden, notFound } from '../../common/app-exception';
import { toUserShort, userShortSelect } from '../../common/mappers';
import { skipTake } from '../../common/response';
import { PrismaService } from '../../infra/prisma.service';
import { StorageService } from '../../infra/storage.service';
import { FollowsService } from '../follows/follows.service';
import { NotificationsService } from '../notifications/notifications.service';

/** Hamai relation-ho bo yak include — har relation yak query, bidun N+1 (Spec 05 AC5) */
const postInclude = {
  user: { select: userShortSelect },
  images: { orderBy: { order: 'asc' }, select: { fileName: true } },
  comments: { where: { parentId: null }, orderBy: { createdAt: 'desc' }, take: 3, include: { user: { select: userShortSelect } } },
  likes: { orderBy: { createdAt: 'desc' }, take: 2, select: { user: { select: userShortSelect } } },
} satisfies Prisma.PostInclude;

type PostRow = Prisma.PostGetPayload<{ include: typeof postInclude }>;
type CommentRow = Prisma.PostCommentGetPayload<{ include: { user: { select: typeof userShortSelect } } }>;

const order: Prisma.PostOrderByWithRelationInput[] = [{ createdAt: 'desc' }, { id: 'desc' }];

function extractHashtags(text: string | null | undefined): string[] {
  if (!text) return [];
  return [...new Set([...text.matchAll(HASHTAG_REGEX)].map((m) => m[1]!.toLowerCase()))];
}

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly follows: FollowsService,
    private readonly notifications: NotificationsService,
  ) {}

  toCommentDto(c: CommentRow): CommentDto {
    return {
      postCommentId: c.id,
      postId: c.postId,
      userId: c.userId,
      userName: c.user.userName,
      userImage: c.user.avatar,
      comment: c.comment,
      dateCommented: c.createdAt.toISOString(),
      parentId: c.parentId,
      replyCount: c.replyCount,
    };
  }

  /** postLike / postFavorite — 2 query bo `postId IN (...)`, ne N+1 */
  async toDtos(rows: PostRow[], me: string): Promise<PostDto[]> {
    const ids = rows.map((p) => p.id);
    const [liked, favs] = ids.length
      ? await Promise.all([
          this.prisma.postLike.findMany({ where: { userId: me, postId: { in: ids } }, select: { postId: true } }),
          this.prisma.postFavorite.findMany({ where: { userId: me, postId: { in: ids } }, select: { postId: true } }),
        ])
      : [[], []];
    const likedSet = new Set(liked.map((l) => l.postId));
    const favSet = new Set(favs.map((f) => f.postId));
    return rows.map((p) => ({
      postId: p.id,
      userId: p.userId,
      userName: p.user.userName,
      userImage: p.user.avatar,
      title: p.title,
      content: p.content,
      images: p.images.map((i) => i.fileName),
      isReel: p.isReel,
      datePublished: p.createdAt.toISOString(),
      postLike: likedSet.has(p.id),
      postLikeCount: p.likeCount,
      postView: p.viewCount,
      commentCount: p.commentCount,
      postFavorite: favSet.has(p.id),
      comments: p.comments.map((c) => this.toCommentDto(c)),
      userLikes: p.likes.map((l) => toUserShort(l.user)),
    }));
  }

  private async list(where: Prisma.PostWhereInput, q: PaginationQuery, me: string) {
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.post.findMany({ where, include: postInclude, orderBy: order, ...skipTake(q) }),
      this.prisma.post.count({ where }),
    ]);
    return { items: await this.toDtos(rows, me), total };
  }

  getPosts(me: string, q: PaginationQuery & { UserId?: string; Title?: string; Content?: string }) {
    return this.list(
      {
        ...(q.UserId ? { userId: q.UserId } : {}),
        ...(q.Title ? { title: { contains: q.Title, mode: 'insensitive' } } : {}),
        ...(q.Content ? { content: { contains: q.Content, mode: 'insensitive' } } : {}),
      },
      q,
      me,
    );
  }

  /** Spec 07: faqat reel-ho, `createdAt DESC` (P0) */
  getReels(me: string, q: PaginationQuery) {
    return this.list({ isReel: true }, q, me);
  }

  /** Feed (Spec 05): postho az follow-shudahoi `userId` + xudash */
  async getFollowing(me: string, q: PaginationQuery & { UserId?: string }) {
    const owner = q.UserId ?? me;
    const ids = await this.follows.followingIds(owner);
    return this.list({ userId: { in: [owner, ...ids] } }, q, me);
  }

  async getMine(me: string) {
    const rows = await this.prisma.post.findMany({ where: { userId: me }, include: postInclude, orderBy: order });
    return this.toDtos(rows, me);
  }

  async getById(me: string, id: number) {
    const row = await this.prisma.post.findUnique({ where: { id }, include: postInclude });
    if (!row) throw notFound(ErrorCode.POST_NOT_FOUND);
    return (await this.toDtos([row], me))[0]!;
  }

  async getFavorites(me: string, q: PaginationQuery) {
    const where: Prisma.PostWhereInput = { favorites: { some: { userId: me } } };
    return this.list(where, q, me);
  }

  async assertExists(postId: number) {
    const p = await this.prisma.post.findUnique({ where: { id: postId }, select: { id: true, userId: true } });
    if (!p) throw notFound(ErrorCode.POST_NOT_FOUND);
    return p;
  }

  async addPost(me: string, body: { Title?: string; Content?: string }, files: Express.Multer.File[]) {
    if (!files.length) throw badRequest(ErrorCode.MEDIA_REQUIRED);
    if (files.length > MEDIA_RULES.maxPostFiles) throw badRequest(ErrorCode.VALIDATION_ERROR);
    files.forEach((f) => this.storage.assertAllowed(f, 'media'));

    // Reel = aniq 1 video (Spec 07)
    const isReel = files.length === 1 && this.storage.isVideo(files[0]!.mimetype);
    const fileNames = await Promise.all(files.map((f) => this.storage.save(f, 'media')));
    const tags = extractHashtags(body.Content);

    try {
      const post = await this.prisma.$transaction(async (tx) => {
        const created = await tx.post.create({
          data: {
            userId: me,
            title: body.Title || null,
            content: body.Content || null,
            isReel,
            images: { create: fileNames.map((fileName, order) => ({ fileName, order })) },
          },
        });
        await this.linkHashtags(tx, created.id, tags);
        await tx.user.update({ where: { id: me }, data: { postsCount: { increment: 1 } } });
        return created;
      });
      return this.getById(me, post.id);
    } catch (err) {
      fileNames.forEach((f) => this.storage.remove(f));
      throw err;
    }
  }

  private async linkHashtags(tx: Prisma.TransactionClient, postId: number, tags: string[]) {
    for (const name of tags) {
      const tag = await tx.hashtag.upsert({ where: { name }, create: { name }, update: {}, select: { id: true } });
      await tx.postHashtag.createMany({ data: [{ postId, hashtagId: tag.id }], skipDuplicates: true });
    }
  }

  async deletePost(me: string, id: number) {
    const post = await this.prisma.post.findUnique({ where: { id }, select: { userId: true, images: { select: { fileName: true } } } });
    if (!post) throw notFound(ErrorCode.POST_NOT_FOUND);
    if (post.userId !== me) throw forbidden();
    await this.prisma.$transaction([
      this.prisma.post.delete({ where: { id } }),
      this.prisma.user.update({ where: { id: me }, data: { postsCount: { decrement: 1 } } }),
    ]);
    post.images.forEach((i) => this.storage.remove(i.fileName));
    return true;
  }

  /** Toggle; counter faqat agar satr voqean sohta/hazf shud — hech vaqt takror yo manfi nest */
  async toggleLike(me: string, postId: number) {
    const post = await this.assertExists(postId);
    const result = await this.prisma.$transaction(async (tx) => {
      const removed = await tx.postLike.deleteMany({ where: { userId: me, postId } });
      if (removed.count === 1) {
        const p = await tx.post.update({ where: { id: postId }, data: { likeCount: { decrement: 1 } }, select: { likeCount: true } });
        return { isLiked: false, likeCount: p.likeCount };
      }
      const { count } = await tx.postLike.createMany({ data: [{ userId: me, postId }], skipDuplicates: true });
      const p = count === 1
        ? await tx.post.update({ where: { id: postId }, data: { likeCount: { increment: 1 } }, select: { likeCount: true } })
        : await tx.post.findUniqueOrThrow({ where: { id: postId }, select: { likeCount: true } });
      return { isLiked: true, likeCount: p.likeCount };
    });
    const event = { type: 'LIKE' as const, actorId: me, recipientId: post.userId, postId };
    await (result.isLiked ? this.notifications.notify(event) : this.notifications.retract(event));
    return result;
  }

  /** Yak user = yak view */
  async view(me: string, postId: number) {
    await this.assertExists(postId);
    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.postView.createMany({ data: [{ userId: me, postId }], skipDuplicates: true });
      const p = count === 1
        ? await tx.post.update({ where: { id: postId }, data: { viewCount: { increment: 1 } }, select: { viewCount: true } })
        : await tx.post.findUniqueOrThrow({ where: { id: postId }, select: { viewCount: true } });
      return { viewCount: p.viewCount };
    });
  }

  async toggleFavorite(me: string, postId: number) {
    await this.assertExists(postId);
    const removed = await this.prisma.postFavorite.deleteMany({ where: { userId: me, postId } });
    if (removed.count === 1) return { isFavorite: false };
    await this.prisma.postFavorite.createMany({ data: [{ userId: me, postId }], skipDuplicates: true });
    return { isFavorite: true };
  }

  async addComment(me: string, postId: number, comment: string, parentId?: number | null) {
    const post = await this.assertExists(postId);
    // Javob faqat ba comment-i sathi yakumi hamin post (Spec 13 §3)
    const parent = parentId
      ? await this.prisma.postComment.findUnique({ where: { id: parentId }, select: { postId: true, parentId: true, userId: true } })
      : null;
    if (parentId && (!parent || parent.postId !== postId || parent.parentId !== null)) {
      throw badRequest(ErrorCode.INVALID_PARENT_COMMENT);
    }
    const created = await this.prisma.$transaction(async (tx) => {
      const c = await tx.postComment.create({
        data: { postId, userId: me, comment, parentId: parentId ?? null },
        include: { user: { select: userShortSelect } },
      });
      await tx.post.update({ where: { id: postId }, data: { commentCount: { increment: 1 } } });
      if (parentId) await tx.postComment.update({ where: { id: parentId }, data: { replyCount: { increment: 1 } } });
      return c;
    });
    await this.notifications.notify(
      parent
        ? { type: 'COMMENT_REPLY', actorId: me, recipientId: parent.userId, postId, commentId: created.id }
        : { type: 'COMMENT', actorId: me, recipientId: post.userId, postId, commentId: created.id },
    );
    return this.toCommentDto(created);
  }

  /** Comment-hoi sathi yakum, nav → kuhna (Spec 13 §3) */
  async getComments(postId: number, q: PaginationQuery) {
    await this.assertExists(postId);
    const where: Prisma.PostCommentWhereInput = { postId, parentId: null };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.postComment.findMany({
        where,
        include: { user: { select: userShortSelect } },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        ...skipTake(q),
      }),
      this.prisma.postComment.count({ where }),
    ]);
    return { items: rows.map((c) => this.toCommentDto(c)), total };
  }

  async getReplies(commentId: number) {
    const parent = await this.prisma.postComment.findUnique({ where: { id: commentId }, select: { id: true } });
    if (!parent) throw notFound(ErrorCode.COMMENT_NOT_FOUND);
    const rows = await this.prisma.postComment.findMany({
      where: { parentId: commentId },
      include: { user: { select: userShortSelect } },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
    return rows.map((c) => this.toCommentDto(c));
  }

  /** Explore: na xudam va na follow-shudaho; populyar avval (Spec 13 §2) */
  async getExplore(me: string, q: PaginationQuery) {
    const exclude = [me, ...(await this.follows.followingIds(me))];
    const [ranked, total] = await Promise.all([
      this.prisma.$queryRaw<{ id: number }[]>`
        SELECT "id" FROM "Post"
        WHERE "userId" <> ALL(${exclude}::text[])
        ORDER BY ("likeCount" + 2 * "commentCount") DESC, "createdAt" DESC, "id" DESC
        LIMIT ${q.PageSize} OFFSET ${(q.PageNumber - 1) * q.PageSize}`,
      this.prisma.post.count({ where: { userId: { notIn: exclude } } }),
    ]);
    const rows = await this.prisma.post.findMany({ where: { id: { in: ranked.map((r) => r.id) } }, include: postInclude });
    const byId = new Map(rows.map((r) => [r.id, r]));
    const ordered = ranked.map((r) => byId.get(r.id)).filter((r): r is PostRow => !!r);
    return { items: await this.toDtos(ordered, me), total };
  }

  async searchHashtags(query: string): Promise<HashtagDto[]> {
    const rows = await this.prisma.hashtag.findMany({
      where: { name: { startsWith: query } },
      select: { name: true, _count: { select: { posts: true } } },
      take: 20,
    });
    return rows.map((h) => ({ name: h.name, postsCount: h._count.posts })).sort((a, b) => b.postsCount - a.postsCount);
  }

  getHashtagPosts(me: string, name: string, q: PaginationQuery) {
    return this.list({ hashtags: { some: { hashtag: { name } } } }, q, me);
  }


  /** Muallifi comment yo muallifi post */
  async deleteComment(me: string, commentId: number) {
    const c = await this.prisma.postComment.findUnique({
      where: { id: commentId },
      select: { userId: true, postId: true, parentId: true, post: { select: { userId: true } } },
    });
    if (!c) throw notFound(ErrorCode.COMMENT_NOT_FOUND);
    if (c.userId !== me && c.post.userId !== me) throw forbidden();
    // Comment bo hamai javobhoyash va notification-hoyash (cascade) hazf meshavad
    await this.prisma.$transaction(async (tx) => {
      const replies = await tx.postComment.count({ where: { parentId: commentId } });
      const { count } = await tx.postComment.deleteMany({ where: { id: commentId } });
      if (count === 1) {
        await tx.post.update({ where: { id: c.postId }, data: { commentCount: { decrement: 1 + replies } } });
        if (c.parentId) await tx.postComment.updateMany({ where: { id: c.parentId }, data: { replyCount: { decrement: 1 } } });
      }
    });
    return true;
  }
}

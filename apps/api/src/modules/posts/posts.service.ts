import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  COMMENT_PIN_LIMIT,
  CommentDto,
  ErrorCode,
  HASHTAG_REGEX,
  HashtagDto,
  MEDIA_RULES,
  MENTION_REGEX,
  PIN_LIMIT,
  PaginationQuery,
  PostDto,
  PostTagInput,
  UpdatePostDto,
  postTagsInputSchema,
} from '@repo/shared';
import { badRequest, forbidden, notFound } from '../../common/app-exception';
import { toUserShort, userShortSelect } from '../../common/mappers';
import { skipTake } from '../../common/response';
import { PrismaService } from '../../infra/prisma.service';
import { StorageService } from '../../infra/storage.service';
import { FollowsService } from '../follows/follows.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RelationsService } from '../relations/relations.service';

/** Hamai relation-ho bo yak include — har relation yak query, bidun N+1 (Spec 05 AC5) */
const postInclude = {
  user: { select: userShortSelect },
  images: { orderBy: { order: 'asc' }, select: { fileName: true } },
  comments: {
    where: { parentId: null, isRestricted: false },
    orderBy: { createdAt: 'desc' },
    take: 3,
    include: { user: { select: userShortSelect } },
  },
  likes: { orderBy: { createdAt: 'desc' }, take: 2, select: { user: { select: userShortSelect } } },
  tags: { select: { userId: true, x: true, y: true, imageIndex: true, user: { select: { userName: true } } } },
} satisfies Prisma.PostInclude;

type PostRow = Prisma.PostGetPayload<{ include: typeof postInclude }>;
type CommentRow = Prisma.PostCommentGetPayload<{ include: { user: { select: typeof userShortSelect } } }>;

const order: Prisma.PostOrderByWithRelationInput[] = [{ createdAt: 'desc' }, { id: 'desc' }];
/** Dar profil: avval pin-shudaho (Spec 14 §2) */
const profileOrder: Prisma.PostOrderByWithRelationInput[] = [{ pinnedAt: { sort: 'desc', nulls: 'last' } }, ...order];

function extractHashtags(text: string | null | undefined): string[] {
  if (!text) return [];
  return [...new Set([...text.matchAll(HASHTAG_REGEX)].map((m) => m[1]!.toLowerCase()))];
}

function extractMentions(text: string | null | undefined): string[] {
  if (!text) return [];
  return [...new Set([...text.matchAll(MENTION_REGEX)].map((m) => m[1]!.toLowerCase().replace(/\.+$/, '')))].slice(0, 20);
}

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly follows: FollowsService,
    private readonly notifications: NotificationsService,
    private readonly relations: RelationsService,
  ) {}

  toCommentDto(c: CommentRow, liked = false): CommentDto {
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
      isLiked: liked,
      likeCount: c.likeCount,
      isRestricted: c.isRestricted,
      isPinned: c.pinnedAt !== null,
    };
  }

  /** isLiked-i comment-ho — yak query */
  private async toCommentDtos(rows: CommentRow[], me: string): Promise<CommentDto[]> {
    const ids = rows.map((c) => c.id);
    const liked = ids.length
      ? await this.prisma.commentLike.findMany({ where: { userId: me, commentId: { in: ids } }, select: { commentId: true } })
      : [];
    const set = new Set(liked.map((l) => l.commentId));
    return rows.map((c) => this.toCommentDto(c, set.has(c.id)));
  }

  /** postLike / postFavorite — 2 query bo `postId IN (...)`, ne N+1 */
  async toDtos(rows: PostRow[], me: string): Promise<PostDto[]> {
    const ids = rows.map((p) => p.id);
    const commentIds = rows.flatMap((p) => p.comments.map((c) => c.id));
    const [liked, favs, likedComments] = ids.length
      ? await Promise.all([
          this.prisma.postLike.findMany({ where: { userId: me, postId: { in: ids } }, select: { postId: true } }),
          this.prisma.postFavorite.findMany({ where: { userId: me, postId: { in: ids } }, select: { postId: true } }),
          this.prisma.commentLike.findMany({ where: { userId: me, commentId: { in: commentIds } }, select: { commentId: true } }),
        ])
      : [[], [], []];
    const likedSet = new Set(liked.map((l) => l.postId));
    const favSet = new Set(favs.map((f) => f.postId));
    const likedCommentSet = new Set(likedComments.map((l) => l.commentId));
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
      comments: p.comments.map((c) => this.toCommentDto(c, likedCommentSet.has(c.id))),
      userLikes: p.likes.map((l) => toUserShort(l.user)),
      location: p.location,
      tags: p.tags.map((t) => ({ userId: t.userId, userName: t.user.userName, x: t.x, y: t.y, imageIndex: t.imageIndex })),
      hideLikeCount: p.hideLikeCount,
      commentsDisabled: p.commentsDisabled,
      isArchived: p.isArchived,
      isPinned: p.pinnedAt !== null,
    }));
  }

  private async list(where: Prisma.PostWhereInput, q: PaginationQuery, me: string, orderBy = order) {
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.post.findMany({ where, include: postInclude, orderBy, ...skipTake(q) }),
      this.prisma.post.count({ where }),
    ]);
    return { items: await this.toDtos(rows, me), total };
  }

  /** Posthoi namoyon baroi man: archive nest, muallif na blok va na private-i begona (Spec 14 §1) */
  private async visible(me: string): Promise<Prisma.PostWhereInput> {
    return { isArchived: false, user: await this.follows.visibleOwners(me) };
  }

  async getPosts(me: string, q: PaginationQuery & { UserId?: string; Title?: string; Content?: string }) {
    const text: Prisma.PostWhereInput = {
      ...(q.Title ? { title: { contains: q.Title, mode: 'insensitive' } } : {}),
      ...(q.Content ? { content: { contains: q.Content, mode: 'insensitive' } } : {}),
    };
    if (q.UserId) {
      // Profil: hisobi private baroi begona → ruyxati xoli (Spec 14 AC1)
      if (!(await this.follows.canView(me, q.UserId))) return { items: [], total: 0 };
      return this.list({ ...text, userId: q.UserId, isArchived: false }, q, me, profileOrder);
    }
    return this.list({ ...text, ...(await this.visible(me)) }, q, me);
  }

  /** Spec 07: faqat reel-ho, `createdAt DESC` (P0) */
  async getReels(me: string, q: PaginationQuery) {
    return this.list({ isReel: true, ...(await this.visible(me)) }, q, me);
  }

  /** Feed (Spec 05): postho az follow-shudahoi `userId` + xudash; mute-shudaho nest (Spec 14 §1.3) */
  async getFollowing(me: string, q: PaginationQuery & { UserId?: string }) {
    const owner = q.UserId ?? me;
    const [ids, muted, blocked] = await Promise.all([
      this.follows.followingIds(owner),
      this.relations.targetIds(me, 'MUTE_POSTS'),
      this.relations.blockedIds(me),
    ]);
    const hidden = new Set([...muted, ...blocked]);
    const authors = [owner, ...ids].filter((id) => !hidden.has(id));
    return this.list({ userId: { in: authors }, isArchived: false }, q, me);
  }

  async getMine(me: string) {
    const rows = await this.prisma.post.findMany({ where: { userId: me, isArchived: false }, include: postInclude, orderBy: profileOrder });
    return this.toDtos(rows, me);
  }

  async getById(me: string, id: number) {
    const row = await this.prisma.post.findUnique({ where: { id }, include: postInclude });
    if (!row || (row.isArchived && row.userId !== me)) throw notFound(ErrorCode.POST_NOT_FOUND);
    if (await this.relations.isBlockedEither(me, row.userId)) throw notFound(ErrorCode.POST_NOT_FOUND);
    if (!(await this.follows.canView(me, row.userId))) throw forbidden(ErrorCode.PRIVATE_ACCOUNT);
    return (await this.toDtos([row], me))[0]!;
  }

  async getFavorites(me: string, q: PaginationQuery) {
    return this.list({ favorites: { some: { userId: me } }, ...(await this.visible(me)) }, q, me);
  }

  /** Posthoe ki user dar onho tag shudaast (tab-i TAGGED) */
  async getTagged(me: string, userId: string, q: PaginationQuery) {
    if (await this.relations.isBlockedEither(me, userId)) return { items: [], total: 0 };
    return this.list({ tags: { some: { userId } }, ...(await this.visible(me)) }, q, me);
  }

  async getLocationPosts(me: string, name: string, q: PaginationQuery) {
    return this.list({ location: { equals: name, mode: 'insensitive' }, ...(await this.visible(me)) }, q, me);
  }

  async getCollectionPosts(me: string, collectionId: number, q: PaginationQuery) {
    return this.list({ collectionItems: { some: { collectionId } }, ...(await this.visible(me)) }, q, me);
  }

  /** Feed-i "Favorites" (Spec 15 §1): faqat postho-i userhoi Favorites */
  async getFavoritesFeed(me: string, q: PaginationQuery) {
    const [favs, blocked] = await Promise.all([this.relations.targetIds(me, 'FAVORITE'), this.relations.blockedIds(me)]);
    const authors = favs.filter((id) => !blocked.includes(id));
    return this.list({ userId: { in: authors }, isArchived: false, user: await this.follows.visibleOwners(me) }, q, me);
  }

  /** "Your activity → Likes" (Spec 15 §6): tartib — vaqti like, nav avval */
  async getLiked(me: string, q: PaginationQuery) {
    const where: Prisma.PostLikeWhereInput = { userId: me, post: await this.visible(me) };
    const [likes, total] = await this.prisma.$transaction([
      this.prisma.postLike.findMany({ where, orderBy: { createdAt: 'desc' }, select: { postId: true }, ...skipTake(q) }),
      this.prisma.postLike.count({ where }),
    ]);
    const rows = await this.prisma.post.findMany({ where: { id: { in: likes.map((l) => l.postId) } }, include: postInclude });
    const byId = new Map(rows.map((r) => [r.id, r]));
    const ordered = likes.map((l) => byId.get(l.postId)).filter((r): r is PostRow => !!r);
    return { items: await this.toDtos(ordered, me), total };
  }

  /** Tab-i REELS dar profil (Spec 15 §2) */
  async getUserReels(me: string, userId: string, q: PaginationQuery) {
    if (!(await this.follows.canView(me, userId))) return { items: [], total: 0 };
    return this.list({ userId, isReel: true, isArchived: false }, q, me, profileOrder);
  }

  async getArchived(me: string, q: PaginationQuery) {
    return this.list({ userId: me, isArchived: true }, q, me);
  }

  async assertExists(postId: number) {
    const p = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, userId: true, commentsDisabled: true, isArchived: true },
    });
    if (!p) throw notFound(ErrorCode.POST_NOT_FOUND);
    return p;
  }

  private async assertOwner(me: string, postId: number) {
    const p = await this.assertExists(postId);
    if (p.userId !== me) throw forbidden();
    return p;
  }

  /** Tag-ho az JSON-i multipart; username → userId (faqat userhoi mavjud va na blok) */
  private async resolveTags(me: string, raw: string | undefined): Promise<(Omit<PostTagInput, 'userName'> & { userId: string })[]> {
    if (!raw) return [];
    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      throw badRequest(ErrorCode.VALIDATION_ERROR);
    }
    const parsed = postTagsInputSchema.safeParse(json);
    if (!parsed.success) throw badRequest(ErrorCode.VALIDATION_ERROR);
    const names = [...new Set(parsed.data.map((t) => t.userName))];
    const blocked = await this.relations.blockedIds(me);
    const users = await this.prisma.user.findMany({ where: { userName: { in: names }, id: { notIn: blocked } }, select: { id: true, userName: true } });
    const byName = new Map(users.map((u) => [u.userName, u.id]));
    const seen = new Set<string>();
    return parsed.data.flatMap((t) => {
      const userId = byName.get(t.userName);
      if (!userId || seen.has(userId)) return [];
      seen.add(userId);
      return [{ userId, x: t.x, y: t.y, imageIndex: t.imageIndex }];
    });
  }

  async addPost(
    me: string,
    body: { Title?: string; Content?: string; Location?: string; Tags?: string },
    files: Express.Multer.File[],
  ) {
    if (!files.length) throw badRequest(ErrorCode.MEDIA_REQUIRED);
    if (files.length > MEDIA_RULES.maxPostFiles) throw badRequest(ErrorCode.VALIDATION_ERROR);
    files.forEach((f) => this.storage.assertAllowed(f, 'media'));
    const tagRows = await this.resolveTags(me, body.Tags);

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
            location: body.Location || null,
            isReel,
            images: { create: fileNames.map((fileName, order) => ({ fileName, order })) },
            tags: { create: tagRows.map((t) => ({ ...t, imageIndex: Math.min(t.imageIndex, fileNames.length - 1) })) },
          },
        });
        await this.linkHashtags(tx, created.id, tags);
        await tx.user.update({ where: { id: me }, data: { postsCount: { increment: 1 } } });
        return created;
      });
      for (const t of tagRows) await this.notifications.notify({ type: 'TAG', actorId: me, recipientId: t.userId, postId: post.id });
      await this.notifyMentions(me, body.Content, post.id);
      return this.getById(me, post.id);
    } catch (err) {
      fileNames.forEach((f) => this.storage.remove(f));
      throw err;
    }
  }

  /** @username → notification MENTION (Spec 14 §2) */
  private async notifyMentions(me: string, text: string | null | undefined, postId: number, commentId?: number) {
    const names = extractMentions(text);
    if (!names.length) return;
    const users = await this.prisma.user.findMany({ where: { userName: { in: names } }, select: { id: true } });
    for (const u of users) await this.notifications.notify({ type: 'MENTION', actorId: me, recipientId: u.id, postId, commentId });
  }

  private async linkHashtags(tx: Prisma.TransactionClient, postId: number, tags: string[]) {
    for (const name of tags) {
      const tag = await tx.hashtag.upsert({ where: { name }, create: { name }, update: {}, select: { id: true } });
      await tx.postHashtag.createMany({ data: [{ postId, hashtagId: tag.id }], skipDuplicates: true });
    }
  }

  /** Tahriri post: faqat muallif; hashtag-ho az nav (Spec 14 §2) */
  async updatePost(me: string, dto: UpdatePostDto) {
    await this.assertOwner(me, dto.postId);
    await this.prisma.$transaction(async (tx) => {
      await tx.post.update({
        where: { id: dto.postId },
        data: {
          ...(dto.content !== undefined ? { content: dto.content || null } : {}),
          ...(dto.location !== undefined ? { location: dto.location || null } : {}),
          ...(dto.hideLikeCount !== undefined ? { hideLikeCount: dto.hideLikeCount } : {}),
          ...(dto.commentsDisabled !== undefined ? { commentsDisabled: dto.commentsDisabled } : {}),
        },
      });
      if (dto.content !== undefined) {
        await tx.postHashtag.deleteMany({ where: { postId: dto.postId } });
        await this.linkHashtags(tx, dto.postId, extractHashtags(dto.content));
      }
    });
    if (dto.content) await this.notifyMentions(me, dto.content, dto.postId);
    return this.getById(me, dto.postId);
  }

  async toggleArchive(me: string, postId: number) {
    const p = await this.assertOwner(me, postId);
    const isArchived = !p.isArchived;
    // Posti archive-shuda pin nameshavad
    await this.prisma.post.update({ where: { id: postId }, data: { isArchived, ...(isArchived ? { pinnedAt: null } : {}) } });
    return { value: isArchived };
  }

  async togglePin(me: string, postId: number) {
    await this.assertOwner(me, postId);
    const p = await this.prisma.post.findUniqueOrThrow({ where: { id: postId }, select: { pinnedAt: true, isArchived: true } });
    if (p.pinnedAt) {
      await this.prisma.post.update({ where: { id: postId }, data: { pinnedAt: null } });
      return { value: false };
    }
    if (p.isArchived) throw badRequest(ErrorCode.VALIDATION_ERROR);
    const pinned = await this.prisma.post.count({ where: { userId: me, pinnedAt: { not: null } } });
    if (pinned >= PIN_LIMIT) throw badRequest(ErrorCode.PIN_LIMIT);
    await this.prisma.post.update({ where: { id: postId }, data: { pinnedAt: new Date() } });
    return { value: true };
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
    if (await this.relations.isBlockedEither(me, post.userId)) throw forbidden(ErrorCode.BLOCKED);
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
    if (removed.count === 1) {
      // Az saved berun → az hamai collection-ho ham
      await this.prisma.collectionItem.deleteMany({ where: { postId, collection: { userId: me } } });
      return { isFavorite: false };
    }
    await this.prisma.postFavorite.createMany({ data: [{ userId: me, postId }], skipDuplicates: true });
    return { isFavorite: true };
  }

  async addComment(me: string, postId: number, comment: string, parentId?: number | null) {
    const post = await this.assertExists(postId);
    if (post.commentsDisabled) throw forbidden(ErrorCode.COMMENTS_DISABLED);
    if (await this.relations.isBlockedEither(me, post.userId)) throw forbidden(ErrorCode.BLOCKED);
    // Javob faqat ba comment-i sathi yakumi hamin post (Spec 13 §3)
    const parent = parentId
      ? await this.prisma.postComment.findUnique({ where: { id: parentId }, select: { postId: true, parentId: true, userId: true } })
      : null;
    if (parentId && (!parent || parent.postId !== postId || parent.parentId !== null)) {
      throw badRequest(ErrorCode.INVALID_PARENT_COMMENT);
    }
    // Muallifi post maro restrict kardaast → comment faqat baroi man va u (Spec 14 §1.4)
    const isRestricted = await this.relations.has(post.userId, me, 'RESTRICT');
    const created = await this.prisma.$transaction(async (tx) => {
      const c = await tx.postComment.create({
        data: { postId, userId: me, comment, parentId: parentId ?? null, isRestricted },
        include: { user: { select: userShortSelect } },
      });
      if (!isRestricted) {
        await tx.post.update({ where: { id: postId }, data: { commentCount: { increment: 1 } } });
        if (parentId) await tx.postComment.update({ where: { id: parentId }, data: { replyCount: { increment: 1 } } });
      }
      return c;
    });
    if (!isRestricted) {
      await this.notifications.notify(
        parent
          ? { type: 'COMMENT_REPLY', actorId: me, recipientId: parent.userId, postId, commentId: created.id }
          : { type: 'COMMENT', actorId: me, recipientId: post.userId, postId, commentId: created.id },
      );
      await this.notifyMentions(me, comment, postId, created.id);
    }
    return this.toCommentDto(created);
  }

  /** Comment-i restrict-shuda — faqat baroi muallifi comment va muallifi post */
  private async commentFilter(me: string, postId: number): Promise<Prisma.PostCommentWhereInput> {
    const post = await this.assertExists(postId);
    const blocked = await this.relations.blockedIds(me);
    return {
      userId: { notIn: blocked },
      ...(post.userId === me ? {} : { OR: [{ isRestricted: false }, { userId: me }] }),
    };
  }

  /** Comment-hoi sathi yakum, nav → kuhna (Spec 13 §3) */
  async getComments(me: string, postId: number, q: PaginationQuery) {
    const where: Prisma.PostCommentWhereInput = { postId, parentId: null, ...(await this.commentFilter(me, postId)) };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.postComment.findMany({
        where,
        include: { user: { select: userShortSelect } },
        // Avval pin-shudaho (Spec 15 §2)
        orderBy: [{ pinnedAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }, { id: 'desc' }],
        ...skipTake(q),
      }),
      this.prisma.postComment.count({ where }),
    ]);
    return { items: await this.toCommentDtos(rows, me), total };
  }

  async getReplies(me: string, commentId: number) {
    const parent = await this.prisma.postComment.findUnique({ where: { id: commentId }, select: { id: true, postId: true } });
    if (!parent) throw notFound(ErrorCode.COMMENT_NOT_FOUND);
    const rows = await this.prisma.postComment.findMany({
      where: { parentId: commentId, ...(await this.commentFilter(me, parent.postId)) },
      include: { user: { select: userShortSelect } },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
    return this.toCommentDtos(rows, me);
  }

  /** Pin-i comment (Spec 15 §2): faqat muallifi post, faqat sathi yakum, maks. 3; toggle */
  async toggleCommentPin(me: string, commentId: number) {
    const c = await this.prisma.postComment.findUnique({
      where: { id: commentId },
      select: { postId: true, parentId: true, pinnedAt: true, post: { select: { userId: true } } },
    });
    if (!c) throw notFound(ErrorCode.COMMENT_NOT_FOUND);
    if (c.post.userId !== me) throw forbidden(ErrorCode.NOT_OWNER);
    if (c.parentId) throw badRequest(ErrorCode.VALIDATION_ERROR);
    if (c.pinnedAt) {
      await this.prisma.postComment.update({ where: { id: commentId }, data: { pinnedAt: null } });
      return { value: false };
    }
    const pinned = await this.prisma.postComment.count({ where: { postId: c.postId, pinnedAt: { not: null } } });
    if (pinned >= COMMENT_PIN_LIMIT) throw badRequest(ErrorCode.COMMENT_PIN_LIMIT);
    await this.prisma.postComment.update({ where: { id: commentId }, data: { pinnedAt: new Date() } });
    return { value: true };
  }

  /** Like-i comment, toggle (Spec 14 §2) */
  async toggleCommentLike(me: string, commentId: number) {
    const c = await this.prisma.postComment.findUnique({ where: { id: commentId }, select: { userId: true, postId: true } });
    if (!c) throw notFound(ErrorCode.COMMENT_NOT_FOUND);
    const result = await this.prisma.$transaction(async (tx) => {
      const removed = await tx.commentLike.deleteMany({ where: { userId: me, commentId } });
      if (removed.count === 1) {
        const r = await tx.postComment.update({ where: { id: commentId }, data: { likeCount: { decrement: 1 } }, select: { likeCount: true } });
        return { isLiked: false, likeCount: r.likeCount };
      }
      const { count } = await tx.commentLike.createMany({ data: [{ userId: me, commentId }], skipDuplicates: true });
      const r = count === 1
        ? await tx.postComment.update({ where: { id: commentId }, data: { likeCount: { increment: 1 } }, select: { likeCount: true } })
        : await tx.postComment.findUniqueOrThrow({ where: { id: commentId }, select: { likeCount: true } });
      return { isLiked: true, likeCount: r.likeCount };
    });
    const event = { type: 'COMMENT_LIKE' as const, actorId: me, recipientId: c.userId, postId: c.postId, commentId };
    await (result.isLiked ? this.notifications.notify(event) : this.notifications.retract(event));
    return result;
  }

  /** Explore: na xudam va na follow-shudaho; populyar avval (Spec 13 §2); private, archive, blok nest (Spec 14) */
  async getExplore(me: string, q: PaginationQuery) {
    const exclude = [me, ...(await this.follows.followingIds(me)), ...(await this.relations.blockedIds(me))];
    const [ranked, total] = await Promise.all([
      this.prisma.$queryRaw<{ id: number }[]>`
        SELECT p."id" FROM "Post" p JOIN "User" u ON u."id" = p."userId"
        WHERE p."userId" <> ALL(${exclude}::text[]) AND p."isArchived" = false AND u."isPrivate" = false
        ORDER BY (p."likeCount" + 2 * p."commentCount") DESC, p."createdAt" DESC, p."id" DESC
        LIMIT ${q.PageSize} OFFSET ${(q.PageNumber - 1) * q.PageSize}`,
      this.prisma.post.count({ where: { userId: { notIn: exclude }, isArchived: false, user: { isPrivate: false } } }),
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

  async getHashtagPosts(me: string, name: string, q: PaginationQuery) {
    return this.list({ hashtags: { some: { hashtag: { name } } }, ...(await this.visible(me)) }, q, me);
  }

  /** Muallifi comment yo muallifi post */
  async deleteComment(me: string, commentId: number) {
    const c = await this.prisma.postComment.findUnique({
      where: { id: commentId },
      select: { userId: true, postId: true, parentId: true, isRestricted: true, post: { select: { userId: true } } },
    });
    if (!c) throw notFound(ErrorCode.COMMENT_NOT_FOUND);
    if (c.userId !== me && c.post.userId !== me) throw forbidden();
    // Comment bo hamai javobhoyash va notification-hoyash (cascade) hazf meshavad
    await this.prisma.$transaction(async (tx) => {
      const replies = await tx.postComment.count({ where: { parentId: commentId, isRestricted: false } });
      const { count } = await tx.postComment.deleteMany({ where: { id: commentId } });
      if (count === 1 && !c.isRestricted) {
        await tx.post.update({ where: { id: c.postId }, data: { commentCount: { decrement: 1 + replies } } });
        if (c.parentId) await tx.postComment.updateMany({ where: { id: c.parentId }, data: { replyCount: { decrement: 1 } } });
      }
    });
    return true;
  }
}

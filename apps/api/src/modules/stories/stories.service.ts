import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ErrorCode, GetStoryDto, GetStoryViewDto, HighlightDto, STORY_TTL_MS, UserStories } from '@repo/shared';
import { badRequest, forbidden, notFound } from '../../common/app-exception';
import { userShortSelect } from '../../common/mappers';
import { PrismaService } from '../../infra/prisma.service';
import { StorageService } from '../../infra/storage.service';
import { ChatService } from '../chat/chat.service';
import { FollowsService } from '../follows/follows.service';
import { PostsService } from '../posts/posts.service';
import { RelationsService } from '../relations/relations.service';

const storyInclude = (me: string) =>
  ({
    user: { select: { ...userShortSelect } },
    views: { where: { viewerId: me }, select: { id: true } },
    likes: { where: { userId: me }, select: { userId: true } },
    _count: { select: { views: true, likes: true } },
  }) satisfies Prisma.StoryInclude;

type StoryRow = Prisma.StoryGetPayload<{ include: ReturnType<typeof storyInclude> }>;

const alive = () => ({ expiresAt: { gt: new Date() } });

/** Story-i close friends — faqat baroi muallif va close friends-i u (Spec 14 §3) */
const audience = (me: string): Prisma.StoryWhereInput => ({
  OR: [{ closeFriends: false }, { userId: me }, { user: { relations: { some: { targetId: me, type: 'CLOSE_FRIEND' } } } }],
});

@Injectable()
export class StoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly follows: FollowsService,
    private readonly posts: PostsService,
    private readonly relations: RelationsService,
    private readonly chat: ChatService,
  ) {}

  private toDto(s: StoryRow, me: string): GetStoryDto {
    const isOwner = s.userId === me;
    return {
      id: s.id,
      fileName: s.fileName,
      postId: s.postId,
      createAt: s.createdAt.toISOString(),
      userId: s.userId,
      userAvatar: s.user.avatar,
      liked: s.likes.length > 0,
      viewed: isOwner || s.views.length > 0,
      // Shumorai binandagon — faqat baroi muallif (Spec 06 AC3)
      viewerDto: {
        userName: s.user.userName,
        name: s.user.fullName,
        viewCount: isOwner ? s._count.views : null,
        viewLike: isOwner ? s._count.likes : null,
      },
      closeFriends: s.closeFriends,
      userName: s.user.userName,
      expiresAt: s.expiresAt.toISOString(),
    };
  }

  private group(rows: StoryRow[], me: string): UserStories[] {
    const byUser = new Map<string, UserStories>();
    for (const s of rows) {
      let entry = byUser.get(s.userId);
      if (!entry) {
        entry = { userId: s.userId, userName: s.user.userName, userImage: s.user.avatar, hasUnseen: false, stories: [], hasCloseFriends: false };
        byUser.set(s.userId, entry);
      }
      const dto = this.toDto(s, me);
      entry.stories.push(dto);
      if (!dto.viewed) entry.hasUnseen = true;
      if (dto.closeFriends) entry.hasCloseFriends = true;
    }
    return [...byUser.values()];
  }

  /** Tray: avval xudam, ba'd `hasUnseen`, ba'd story-i navtarin (Spec 06); mute va blok nest (Spec 14) */
  async feed(me: string): Promise<UserStories[]> {
    const [ids, muted, blocked] = await Promise.all([
      this.follows.followingIds(me),
      this.relations.targetIds(me, 'MUTE_STORIES'),
      this.relations.blockedIds(me),
    ]);
    const hidden = new Set([...muted, ...blocked]);
    const rows = await this.prisma.story.findMany({
      where: { userId: { in: [me, ...ids.filter((id) => !hidden.has(id))] }, ...alive(), ...audience(me) },
      include: storyInclude(me),
      orderBy: { createdAt: 'asc' },
    });
    const latest = (u: UserStories) => u.stories[u.stories.length - 1]!.createAt;
    return this.group(rows, me).sort((a, b) => {
      if (a.userId === me) return -1;
      if (b.userId === me) return 1;
      if (a.hasUnseen !== b.hasUnseen) return a.hasUnseen ? -1 : 1;
      return latest(b).localeCompare(latest(a));
    });
  }

  async forUser(me: string, userId: string): Promise<UserStories> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: userShortSelect });
    if (!user || (await this.relations.isBlockedEither(me, userId))) throw notFound(ErrorCode.USER_NOT_FOUND);
    const empty = { userId, userName: user.userName, userImage: user.avatar, hasUnseen: false, stories: [], hasCloseFriends: false };
    if (!(await this.follows.canView(me, userId))) return empty;
    const rows = await this.prisma.story.findMany({
      where: { userId, ...alive(), ...audience(me) },
      include: storyInclude(me),
      orderBy: { createdAt: 'asc' },
    });
    return this.group(rows, me)[0] ?? empty;
  }

  async getById(me: string, id: number) {
    const s = await this.prisma.story.findUnique({ where: { id }, include: storyInclude(me) });
    if (!s) throw notFound(ErrorCode.STORY_NOT_FOUND);
    return this.toDto(s, me);
  }

  /** Archive-i story: hamai story-hoi man, hatto guzashta (Spec 14 §3) */
  async archive(me: string) {
    const rows = await this.prisma.story.findMany({ where: { userId: me }, include: storyInclude(me), orderBy: { createdAt: 'desc' } });
    return rows.map((s) => this.toDto(s, me));
  }

  async add(me: string, file: Express.Multer.File | undefined, postId?: number, closeFriends = false) {
    if (!file && !postId) throw badRequest(ErrorCode.MEDIA_REQUIRED);
    if (postId) await this.posts.assertExists(postId);
    const fileName = file ? await this.storage.save(file, 'media') : null;
    await this.prisma.story.create({
      data: { userId: me, fileName, postId: postId ?? null, closeFriends, expiresAt: new Date(Date.now() + STORY_TTL_MS) },
    });
    return 'Story added';
  }

  async remove(me: string, id: number) {
    const s = await this.prisma.story.findUnique({ where: { id }, select: { userId: true, fileName: true } });
    if (!s) throw notFound(ErrorCode.STORY_NOT_FOUND);
    if (s.userId !== me) throw forbidden();
    await this.prisma.story.delete({ where: { id } });
    this.storage.remove(s.fileName);
    return true;
  }

  private async assertAlive(id: number) {
    const s = await this.prisma.story.findFirst({ where: { id, ...alive() }, select: { id: true, userId: true } });
    if (!s) throw notFound(ErrorCode.STORY_NOT_FOUND);
    return s;
  }

  async toggleLike(me: string, storyId: number) {
    await this.assertAlive(storyId);
    const { count } = await this.prisma.storyLike.deleteMany({ where: { storyId, userId: me } });
    if (count === 1) return 'Unliked';
    await this.prisma.storyLike.createMany({ data: [{ storyId, userId: me }], skipDuplicates: true });
    return 'Liked';
  }

  /** Idempotent; muallif xudash sabt nameshavad */
  async addView(me: string, storyId: number): Promise<GetStoryViewDto> {
    const s = await this.assertAlive(storyId);
    if (s.userId === me) return { id: 0, viewUserId: me, storyId };
    const v = await this.prisma.storyView.upsert({
      where: { storyId_viewerId: { storyId, viewerId: me } },
      create: { storyId, viewerId: me },
      update: {},
    });
    return { id: v.id, viewUserId: v.viewerId, storyId: v.storyId };
  }

  /** Ruyxati binandagon baroi muallif */
  async viewers(me: string, storyId: number) {
    const s = await this.prisma.story.findUnique({ where: { id: storyId }, select: { userId: true } });
    if (!s) throw notFound(ErrorCode.STORY_NOT_FOUND);
    if (s.userId !== me) throw forbidden();
    const [views, likes] = await Promise.all([
      this.prisma.storyView.findMany({ where: { storyId }, orderBy: { createdAt: 'desc' }, select: { viewer: { select: userShortSelect } } }),
      this.prisma.storyLike.findMany({ where: { storyId }, select: { userId: true } }),
    ]);
    const liked = new Set(likes.map((l) => l.userId));
    return views.map((v) => ({ ...v.viewer, liked: liked.has(v.viewer.id) }));
  }

  replyToStory(me: string, storyId: number, text: string) {
    return this.chat.replyToStory(me, storyId, text);
  }

  // ---- Highlights (Spec 14 §3) ----

  async highlights(me: string, userId: string): Promise<HighlightDto[]> {
    if (!(await this.follows.canView(me, userId))) return [];
    const rows = await this.prisma.highlight.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        title: true,
        _count: { select: { stories: true } },
        stories: { take: 1, orderBy: { story: { createdAt: 'desc' } }, select: { story: { select: { fileName: true } } } },
      },
    });
    return rows.map((h) => ({ id: h.id, title: h.title, cover: h.stories[0]?.story.fileName ?? null, storiesCount: h._count.stories }));
  }

  async highlightStories(me: string, id: number) {
    const h = await this.prisma.highlight.findUnique({ where: { id }, select: { userId: true } });
    if (!h || !(await this.follows.canView(me, h.userId))) throw notFound(ErrorCode.HIGHLIGHT_NOT_FOUND);
    const rows = await this.prisma.story.findMany({
      where: { highlights: { some: { highlightId: id } }, ...audience(me) },
      include: storyInclude(me),
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((s) => this.toDto(s, me));
  }

  private async assertOwnStories(me: string, storyIds: number[]) {
    const n = await this.prisma.story.count({ where: { id: { in: storyIds }, userId: me } });
    if (n !== new Set(storyIds).size) throw forbidden();
  }

  async addHighlight(me: string, title: string, storyIds: number[]) {
    await this.assertOwnStories(me, storyIds);
    const h = await this.prisma.highlight.create({
      data: { userId: me, title, stories: { create: [...new Set(storyIds)].map((storyId) => ({ storyId })) } },
      select: { id: true },
    });
    return h.id;
  }

  async updateHighlight(me: string, id: number, title?: string, storyIds?: number[]) {
    const h = await this.prisma.highlight.findFirst({ where: { id, userId: me }, select: { id: true } });
    if (!h) throw notFound(ErrorCode.HIGHLIGHT_NOT_FOUND);
    if (storyIds) await this.assertOwnStories(me, storyIds);
    await this.prisma.$transaction(async (tx) => {
      if (title) await tx.highlight.update({ where: { id }, data: { title } });
      if (storyIds) {
        await tx.highlightStory.deleteMany({ where: { highlightId: id } });
        await tx.highlightStory.createMany({ data: [...new Set(storyIds)].map((storyId) => ({ highlightId: id, storyId })) });
      }
    });
    return true;
  }

  async deleteHighlight(me: string, id: number) {
    const { count } = await this.prisma.highlight.deleteMany({ where: { id, userId: me } });
    if (count === 0) throw notFound(ErrorCode.HIGHLIGHT_NOT_FOUND);
    return true;
  }
}

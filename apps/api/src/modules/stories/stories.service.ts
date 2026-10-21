import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ErrorCode, GetStoryDto, GetStoryViewDto, STORY_TTL_MS, UserStories } from '@repo/shared';
import { badRequest, forbidden, notFound } from '../../common/app-exception';
import { userShortSelect } from '../../common/mappers';
import { PrismaService } from '../../infra/prisma.service';
import { StorageService } from '../../infra/storage.service';
import { FollowsService } from '../follows/follows.service';
import { PostsService } from '../posts/posts.service';

const storyInclude = (me: string) =>
  ({
    user: { select: { ...userShortSelect } },
    views: { where: { viewerId: me }, select: { id: true } },
    likes: { where: { userId: me }, select: { userId: true } },
    _count: { select: { views: true, likes: true } },
  }) satisfies Prisma.StoryInclude;

type StoryRow = Prisma.StoryGetPayload<{ include: ReturnType<typeof storyInclude> }>;

const alive = () => ({ expiresAt: { gt: new Date() } });

@Injectable()
export class StoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly follows: FollowsService,
    private readonly posts: PostsService,
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
    };
  }

  private group(rows: StoryRow[], me: string): UserStories[] {
    const byUser = new Map<string, UserStories>();
    for (const s of rows) {
      let entry = byUser.get(s.userId);
      if (!entry) {
        entry = { userId: s.userId, userName: s.user.userName, userImage: s.user.avatar, hasUnseen: false, stories: [] };
        byUser.set(s.userId, entry);
      }
      const dto = this.toDto(s, me);
      entry.stories.push(dto);
      if (!dto.viewed) entry.hasUnseen = true;
    }
    return [...byUser.values()];
  }

  /** Tray: avval xudam, ba'd `hasUnseen`, ba'd story-i navtarin (Spec 06) */
  async feed(me: string): Promise<UserStories[]> {
    const ids = await this.follows.followingIds(me);
    const rows = await this.prisma.story.findMany({
      where: { userId: { in: [me, ...ids] }, ...alive() },
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
    if (!user) throw notFound(ErrorCode.USER_NOT_FOUND);
    const rows = await this.prisma.story.findMany({
      where: { userId, ...alive() },
      include: storyInclude(me),
      orderBy: { createdAt: 'asc' },
    });
    return this.group(rows, me)[0] ?? { userId, userName: user.userName, userImage: user.avatar, hasUnseen: false, stories: [] };
  }

  async getById(me: string, id: number) {
    const s = await this.prisma.story.findUnique({ where: { id }, include: storyInclude(me) });
    if (!s) throw notFound(ErrorCode.STORY_NOT_FOUND);
    return this.toDto(s, me);
  }

  async add(me: string, file: Express.Multer.File | undefined, postId?: number) {
    if (!file && !postId) throw badRequest(ErrorCode.MEDIA_REQUIRED);
    if (postId) await this.posts.assertExists(postId);
    const fileName = file ? await this.storage.save(file, 'media') : null;
    await this.prisma.story.create({
      data: { userId: me, fileName, postId: postId ?? null, expiresAt: new Date(Date.now() + STORY_TTL_MS) },
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
}

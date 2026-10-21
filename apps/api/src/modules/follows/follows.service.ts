import { Injectable } from '@nestjs/common';
import { ErrorCode, FollowResult, UserShort } from '@repo/shared';
import { badRequest, notFound } from '../../common/app-exception';
import { toUserShort, userShortSelect } from '../../common/mappers';
import { PrismaService } from '../../infra/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class FollowsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private async assertUser(userId: string) {
    const u = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!u) throw notFound(ErrorCode.USER_NOT_FOUND);
  }

  async isFollowing(followerId: string, followingId: string) {
    const f = await this.prisma.follow.findUnique({ where: { followerId_followingId: { followerId, followingId } } });
    return !!f;
  }

  /** ID-hoi userhoe ki `userId` follow kardaast */
  async followingIds(userId: string): Promise<string[]> {
    const rows = await this.prisma.follow.findMany({ where: { followerId: userId }, select: { followingId: true } });
    return rows.map((r) => r.followingId);
  }

  /** Idempotent: counter faqat agar satr voqean sohta shud (Spec 02 AC2) */
  async follow(me: string, target: string): Promise<FollowResult> {
    if (me === target) throw badRequest(ErrorCode.CANNOT_FOLLOW_SELF);
    await this.assertUser(target);
    const { followersCount, created } = await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.follow.createMany({ data: [{ followerId: me, followingId: target }], skipDuplicates: true });
      if (count === 1) {
        await tx.user.update({ where: { id: me }, data: { followingCount: { increment: 1 } } });
        const u = await tx.user.update({ where: { id: target }, data: { followersCount: { increment: 1 } }, select: { followersCount: true } });
        return { followersCount: u.followersCount, created: true };
      }
      const u = await tx.user.findUniqueOrThrow({ where: { id: target }, select: { followersCount: true } });
      return { followersCount: u.followersCount, created: false };
    });
    if (created) await this.notifications.notify({ type: 'FOLLOW', actorId: me, recipientId: target });
    return { isFollowing: true, subscribersCount: followersCount };
  }

  async unfollow(me: string, target: string): Promise<FollowResult> {
    await this.assertUser(target);
    const followersCount = await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.follow.deleteMany({ where: { followerId: me, followingId: target } });
      if (count === 1) {
        await tx.user.update({ where: { id: me }, data: { followingCount: { decrement: 1 } } });
        return (await tx.user.update({ where: { id: target }, data: { followersCount: { decrement: 1 } }, select: { followersCount: true } }))
          .followersCount;
      }
      return (await tx.user.findUniqueOrThrow({ where: { id: target }, select: { followersCount: true } })).followersCount;
    });
    await this.notifications.retract({ type: 'FOLLOW', actorId: me, recipientId: target });
    return { isFollowing: false, subscribersCount: followersCount };
  }

  /** Kiho `userId`-ro follow kardaand */
  async subscribers(userId: string): Promise<UserShort[]> {
    await this.assertUser(userId);
    const rows = await this.prisma.follow.findMany({
      where: { followingId: userId },
      orderBy: { createdAt: 'desc' },
      select: { follower: { select: userShortSelect } },
    });
    return rows.map((r) => toUserShort(r.follower));
  }

  /** `userId` kiro follow kardaast */
  async subscriptions(userId: string): Promise<UserShort[]> {
    await this.assertUser(userId);
    const rows = await this.prisma.follow.findMany({
      where: { followerId: userId },
      orderBy: { createdAt: 'desc' },
      select: { following: { select: userShortSelect } },
    });
    return rows.map((r) => toUserShort(r.following));
  }
}

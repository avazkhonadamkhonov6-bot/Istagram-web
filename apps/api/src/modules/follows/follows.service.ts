import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ErrorCode, FollowResult, FollowStatus, UserShort } from '@repo/shared';
import { badRequest, forbidden, notFound } from '../../common/app-exception';
import { toUserShort, userShortSelect } from '../../common/mappers';
import { PrismaService } from '../../infra/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RelationsService } from '../relations/relations.service';

@Injectable()
export class FollowsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly relations: RelationsService,
  ) {}

  private async assertUser(userId: string) {
    const u = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, isPrivate: true } });
    if (!u) throw notFound(ErrorCode.USER_NOT_FOUND);
    return u;
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

  /** Kontenti `ownerId`-ro man dida metavonam? (Spec 14 §1.1–1.2) */
  async canView(me: string, ownerId: string) {
    if (me === ownerId) return true;
    if (await this.relations.isBlockedEither(me, ownerId)) return false;
    const owner = await this.prisma.user.findUnique({ where: { id: ownerId }, select: { isPrivate: true } });
    if (!owner) return false;
    return !owner.isPrivate || this.isFollowing(me, ownerId);
  }

  /** Filtr-i Prisma baroi kontenti userhoi begona: na blok, na private (gayr az follow-shudaho) */
  async visibleOwners(me: string): Promise<Prisma.UserWhereInput> {
    const blocked = await this.relations.blockedIds(me);
    return {
      id: { notIn: blocked },
      OR: [{ isPrivate: false }, { id: me }, { followers: { some: { followerId: me } } }],
    };
  }

  async status(me: string, target: string): Promise<FollowStatus> {
    if (await this.isFollowing(me, target)) return 'following';
    const r = await this.prisma.followRequest.findUnique({ where: { requesterId_targetId: { requesterId: me, targetId: target } } });
    return r ? 'requested' : 'none';
  }

  private async createFollow(tx: Prisma.TransactionClient, me: string, target: string) {
    const { count } = await tx.follow.createMany({ data: [{ followerId: me, followingId: target }], skipDuplicates: true });
    if (count === 1) {
      await tx.user.update({ where: { id: me }, data: { followingCount: { increment: 1 } } });
      const u = await tx.user.update({ where: { id: target }, data: { followersCount: { increment: 1 } }, select: { followersCount: true } });
      return { followersCount: u.followersCount, created: true };
    }
    const u = await tx.user.findUniqueOrThrow({ where: { id: target }, select: { followersCount: true } });
    return { followersCount: u.followersCount, created: false };
  }

  /** Idempotent: counter faqat agar satr voqean sohta shud (Spec 02 AC2). Hisobi private → darxost (Spec 14 §1.1) */
  async follow(me: string, target: string): Promise<FollowResult> {
    if (me === target) throw badRequest(ErrorCode.CANNOT_FOLLOW_SELF);
    const user = await this.assertUser(target);
    if (await this.relations.isBlockedEither(me, target)) throw forbidden(ErrorCode.BLOCKED);

    if (user.isPrivate && !(await this.isFollowing(me, target))) {
      const { count } = await this.prisma.followRequest.createMany({ data: [{ requesterId: me, targetId: target }], skipDuplicates: true });
      if (count === 1) await this.notifications.notify({ type: 'FOLLOW_REQUEST', actorId: me, recipientId: target });
      const u = await this.prisma.user.findUniqueOrThrow({ where: { id: target }, select: { followersCount: true } });
      return { isFollowing: false, isRequested: true, subscribersCount: u.followersCount };
    }

    const { followersCount, created } = await this.prisma.$transaction((tx) => this.createFollow(tx, me, target));
    if (created) await this.notifications.notify({ type: 'FOLLOW', actorId: me, recipientId: target });
    return { isFollowing: true, isRequested: false, subscribersCount: followersCount };
  }

  /** Unfollow — darxosti hanuz qabulnashudaro ham bekor mekunad */
  async unfollow(me: string, target: string): Promise<FollowResult> {
    await this.assertUser(target);
    const followersCount = await this.prisma.$transaction(async (tx) => {
      await tx.followRequest.deleteMany({ where: { requesterId: me, targetId: target } });
      const { count } = await tx.follow.deleteMany({ where: { followerId: me, followingId: target } });
      if (count === 1) {
        await tx.user.update({ where: { id: me }, data: { followingCount: { decrement: 1 } } });
        return (await tx.user.update({ where: { id: target }, data: { followersCount: { decrement: 1 } }, select: { followersCount: true } }))
          .followersCount;
      }
      return (await tx.user.findUniqueOrThrow({ where: { id: target }, select: { followersCount: true } })).followersCount;
    });
    await this.notifications.retract({ type: 'FOLLOW', actorId: me, recipientId: target });
    await this.notifications.retract({ type: 'FOLLOW_REQUEST', actorId: me, recipientId: target });
    return { isFollowing: false, isRequested: false, subscribersCount: followersCount };
  }

  /** "Remove follower" (Spec 15 §1): `userId` digar maro follow namekunad; ba u xabar nameravad */
  async removeFollower(me: string, userId: string) {
    await this.assertUser(userId);
    await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.follow.deleteMany({ where: { followerId: userId, followingId: me } });
      if (count === 1) {
        await tx.user.update({ where: { id: userId }, data: { followingCount: { decrement: 1 } } });
        await tx.user.update({ where: { id: me }, data: { followersCount: { decrement: 1 } } });
      }
    });
    await this.notifications.retract({ type: 'FOLLOW', actorId: userId, recipientId: me });
    return true;
  }

  async requests(me: string): Promise<UserShort[]> {
    const rows = await this.prisma.followRequest.findMany({
      where: { targetId: me },
      orderBy: { createdAt: 'desc' },
      select: { requester: { select: userShortSelect } },
    });
    return rows.map((r) => toUserShort(r.requester));
  }

  async accept(me: string, requesterId: string) {
    const { count } = await this.prisma.followRequest.deleteMany({ where: { requesterId, targetId: me } });
    if (count === 0) throw notFound(ErrorCode.NOT_FOUND);
    await this.prisma.$transaction((tx) => this.createFollow(tx, requesterId, me));
    await this.notifications.retract({ type: 'FOLLOW_REQUEST', actorId: requesterId, recipientId: me });
    await this.notifications.notify({ type: 'FOLLOW_ACCEPTED', actorId: me, recipientId: requesterId });
    return true;
  }

  async decline(me: string, requesterId: string) {
    await this.prisma.followRequest.deleteMany({ where: { requesterId, targetId: me } });
    await this.notifications.retract({ type: 'FOLLOW_REQUEST', actorId: requesterId, recipientId: me });
    return true;
  }

  /** Hisob public shud → hamai darxostho qabul */
  async acceptAll(me: string) {
    const rows = await this.prisma.followRequest.findMany({ where: { targetId: me }, select: { requesterId: true } });
    for (const r of rows) await this.accept(me, r.requesterId);
  }

  /** Ruyxati hisobi private baroi begona — xoli (Spec 14 §1.1) */
  private async assertListVisible(me: string, userId: string) {
    await this.assertUser(userId);
    return this.canView(me, userId);
  }

  /** Kiho `userId`-ro follow kardaand */
  async subscribers(me: string, userId: string): Promise<UserShort[]> {
    if (!(await this.assertListVisible(me, userId))) return [];
    const blocked = await this.relations.blockedIds(me);
    const rows = await this.prisma.follow.findMany({
      where: { followingId: userId, followerId: { notIn: blocked } },
      orderBy: { createdAt: 'desc' },
      select: { follower: { select: userShortSelect } },
    });
    return rows.map((r) => toUserShort(r.follower));
  }

  /** `userId` kiro follow kardaast */
  async subscriptions(me: string, userId: string): Promise<UserShort[]> {
    if (!(await this.assertListVisible(me, userId))) return [];
    const blocked = await this.relations.blockedIds(me);
    const rows = await this.prisma.follow.findMany({
      where: { followerId: userId, followingId: { notIn: blocked } },
      orderBy: { createdAt: 'desc' },
      select: { following: { select: userShortSelect } },
    });
    return rows.map((r) => toUserShort(r.following));
  }
}

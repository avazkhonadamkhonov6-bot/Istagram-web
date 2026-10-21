import { Injectable } from '@nestjs/common';
import { Prisma, UserRelationType } from '@prisma/client';
import { AddReportDto, ErrorCode, RelationStatus, UserShort } from '@repo/shared';
import { badRequest, notFound } from '../../common/app-exception';
import { toUserShort, userShortSelect } from '../../common/mappers';
import { PrismaService } from '../../infra/prisma.service';

/**
 * Block, mute, restrict, close friends, report (Spec 14 §1.2–1.6).
 * Vobastagi faqat ba Prisma — har modul (follows, posts, stories, chat, notifications) metavonad istifoda barad.
 */
@Injectable()
export class RelationsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertUser(userId: string) {
    const u = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!u) throw notFound(ErrorCode.USER_NOT_FOUND);
  }

  async has(ownerId: string, targetId: string, type: UserRelationType) {
    const r = await this.prisma.userRelation.findUnique({ where: { ownerId_targetId_type: { ownerId, targetId, type } } });
    return !!r;
  }

  /** Block dar yagon taraf */
  async isBlockedEither(a: string, b: string) {
    if (a === b) return false;
    const n = await this.prisma.userRelation.count({
      where: { type: 'BLOCK', OR: [{ ownerId: a, targetId: b }, { ownerId: b, targetId: a }] },
    });
    return n > 0;
  }

  /** Hamai userhoe ki man blok kardaam yo maro blok kardaand */
  async blockedIds(me: string): Promise<string[]> {
    const rows = await this.prisma.userRelation.findMany({
      where: { type: 'BLOCK', OR: [{ ownerId: me }, { targetId: me }] },
      select: { ownerId: true, targetId: true },
    });
    return [...new Set(rows.map((r) => (r.ownerId === me ? r.targetId : r.ownerId)))];
  }

  async targetIds(ownerId: string, type: UserRelationType): Promise<string[]> {
    const rows = await this.prisma.userRelation.findMany({ where: { ownerId, type }, select: { targetId: true } });
    return rows.map((r) => r.targetId);
  }

  async list(ownerId: string, type: UserRelationType): Promise<UserShort[]> {
    const rows = await this.prisma.userRelation.findMany({
      where: { ownerId, type },
      orderBy: { createdAt: 'desc' },
      select: { target: { select: userShortSelect } },
    });
    return rows.map((r) => toUserShort(r.target));
  }

  /** Idempotent */
  async set(ownerId: string, targetId: string, type: UserRelationType) {
    if (ownerId === targetId) throw badRequest(ErrorCode.VALIDATION_ERROR);
    await this.assertUser(targetId);
    await this.prisma.userRelation.createMany({ data: [{ ownerId, targetId, type }], skipDuplicates: true });
    return true;
  }

  async unset(ownerId: string, targetId: string, types: UserRelationType[]) {
    await this.prisma.userRelation.deleteMany({ where: { ownerId, targetId, type: { in: types } } });
    return true;
  }

  async mute(ownerId: string, targetId: string, posts: boolean, stories: boolean) {
    await this.unset(ownerId, targetId, ['MUTE_POSTS', 'MUTE_STORIES']);
    if (posts) await this.set(ownerId, targetId, 'MUTE_POSTS');
    if (stories) await this.set(ownerId, targetId, 'MUTE_STORIES');
    return true;
  }

  /** Block: follow-ho, darxostho va close friends dar har du taraf hazf; counter-ho isloh */
  async block(me: string, target: string) {
    if (me === target) throw badRequest(ErrorCode.VALIDATION_ERROR);
    await this.assertUser(target);
    await this.prisma.$transaction(async (tx) => {
      await this.removeFollow(tx, me, target);
      await this.removeFollow(tx, target, me);
      await tx.followRequest.deleteMany({ where: { OR: [{ requesterId: me, targetId: target }, { requesterId: target, targetId: me }] } });
      await tx.userRelation.deleteMany({
        where: { type: 'CLOSE_FRIEND', OR: [{ ownerId: me, targetId: target }, { ownerId: target, targetId: me }] },
      });
      await tx.userRelation.createMany({ data: [{ ownerId: me, targetId: target, type: 'BLOCK' }], skipDuplicates: true });
    });
    return true;
  }

  private async removeFollow(tx: Prisma.TransactionClient, followerId: string, followingId: string) {
    const { count } = await tx.follow.deleteMany({ where: { followerId, followingId } });
    if (count === 1) {
      await tx.user.update({ where: { id: followerId }, data: { followingCount: { decrement: 1 } } });
      await tx.user.update({ where: { id: followingId }, data: { followersCount: { decrement: 1 } } });
    }
  }

  async status(me: string, target: string): Promise<RelationStatus> {
    const [follow, request, followsMe, rels] = await Promise.all([
      this.prisma.follow.findUnique({ where: { followerId_followingId: { followerId: me, followingId: target } } }),
      this.prisma.followRequest.findUnique({ where: { requesterId_targetId: { requesterId: me, targetId: target } } }),
      this.prisma.follow.findUnique({ where: { followerId_followingId: { followerId: target, followingId: me } } }),
      this.prisma.userRelation.findMany({ where: { ownerId: me, targetId: target }, select: { type: true } }),
    ]);
    const types = new Set(rels.map((r) => r.type));
    return {
      followStatus: follow ? 'following' : request ? 'requested' : 'none',
      followsMe: !!followsMe,
      isBlocked: types.has('BLOCK'),
      isMutedPosts: types.has('MUTE_POSTS'),
      isMutedStories: types.has('MUTE_STORIES'),
      isRestricted: types.has('RESTRICT'),
      isCloseFriend: types.has('CLOSE_FRIEND'),
    };
  }

  /** Takror az yak user ba yak hadaf — yak satr (sababi nav) */
  async report(me: string, dto: AddReportDto) {
    await this.prisma.report.upsert({
      where: { userId_targetType_targetId: { userId: me, targetType: dto.targetType, targetId: dto.targetId } },
      create: { userId: me, ...dto },
      update: { reason: dto.reason, createdAt: new Date() },
    });
    return true;
  }
}

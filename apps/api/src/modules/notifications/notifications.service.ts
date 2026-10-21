import { Injectable, Logger } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { NotificationDto, PaginationQuery, SocketEvent } from '@repo/shared';
import { userShortSelect } from '../../common/mappers';
import { skipTake } from '../../common/response';
import { PrismaService } from '../../infra/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

type Event = {
  type: NotificationType;
  actorId: string;
  recipientId: string;
  postId?: number;
  commentId?: number;
};

const include = {
  actor: { select: userShortSelect },
  post: { select: { id: true, images: { orderBy: { order: 'asc' }, take: 1, select: { fileName: true } } } },
  comment: { select: { comment: true } },
} satisfies Prisma.NotificationInclude;
type Row = Prisma.NotificationGetPayload<{ include: typeof include }>;

/** Kalidi yakxela — like → unlike → like = yak notification (Spec 13 §1) */
export function notificationKey(e: Event): string {
  switch (e.type) {
    case 'LIKE':
      return `LIKE:${e.actorId}:${e.postId}`;
    case 'FOLLOW':
      return `FOLLOW:${e.actorId}:${e.recipientId}`;
    default:
      return `${e.type}:${e.commentId}`;
  }
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  private async toDtos(rows: Row[], me: string): Promise<NotificationDto[]> {
    const actorIds = [...new Set(rows.map((r) => r.actorId))];
    const following = actorIds.length
      ? await this.prisma.follow.findMany({ where: { followerId: me, followingId: { in: actorIds } }, select: { followingId: true } })
      : [];
    const followingSet = new Set(following.map((f) => f.followingId));
    return rows.map((r) => ({
      id: r.id,
      type: r.type,
      actor: { ...r.actor, isFollowing: followingSet.has(r.actorId) },
      post: r.post ? { postId: r.post.id, image: r.post.images[0]?.fileName ?? null } : null,
      commentText: r.comment?.comment ?? null,
      isRead: r.isRead,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  /**
   * Sohtan + `notification:new`. Ba xud nameoyad. Xato amali asosiro (like, follow) nameshikanad —
   * baroi hamin hamesha pas az transaction-i asosi va bo catch dar daxil.
   */
  async notify(e: Event): Promise<void> {
    if (e.actorId === e.recipientId) return;
    try {
      const key = notificationKey(e);
      const row = await this.prisma.notification.upsert({
        where: { key },
        create: { key, type: e.type, actorId: e.actorId, recipientId: e.recipientId, postId: e.postId, commentId: e.commentId },
        update: { isRead: false, createdAt: new Date() },
        include,
      });
      const [dto] = await this.toDtos([row], e.recipientId);
      this.realtime.emitToUser(e.recipientId, SocketEvent.NOTIFICATION_NEW, dto);
    } catch (err) {
      this.logger.warn({ err, type: e.type }, 'Notification sohta nashud');
    }
  }

  /** Unlike, unfollow, hazfi comment → notification hazf (Spec 13 §1) */
  async retract(e: Event): Promise<void> {
    try {
      await this.prisma.notification.deleteMany({ where: { key: notificationKey(e) } });
    } catch (err) {
      this.logger.warn({ err, type: e.type }, 'Notification hazf nashud');
    }
  }

  async list(me: string, q: PaginationQuery) {
    const where = { recipientId: me };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({ where, include, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], ...skipTake(q) }),
      this.prisma.notification.count({ where }),
    ]);
    return { items: await this.toDtos(rows, me), total };
  }

  async unreadCount(me: string) {
    return { count: await this.prisma.notification.count({ where: { recipientId: me, isRead: false } }) };
  }

  async readAll(me: string) {
    await this.prisma.notification.updateMany({ where: { recipientId: me, isRead: false }, data: { isRead: true } });
    return true;
  }
}

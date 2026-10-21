import { HttpStatus, Injectable, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  ClientEvent,
  ErrorCode,
  LIVE_MAX_VIEWERS,
  LiveCommentDto,
  LiveDto,
  SocketEvent,
  StartLiveDto,
  liveRoomSchema,
  liveSignalSchema,
} from '@repo/shared';
import type { Socket } from 'socket.io';
import { AppException, badRequest, forbidden, notFound } from '../../common/app-exception';
import { toUserShort, userShortSelect } from '../../common/mappers';
import { PrismaService } from '../../infra/prisma.service';
import { FollowsService } from '../follows/follows.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { RelationsService } from '../relations/relations.service';

const liveInclude = { user: { select: userShortSelect } } satisfies Prisma.LiveStreamInclude;
type LiveRow = Prisma.LiveStreamGetPayload<{ include: typeof liveInclude }>;

export const liveRoom = (liveId: number) => `live:${liveId}`;

/**
 * Efiri mustaqim (Spec 16 §3).
 * Tartibi WebRTC: tamoshobin `live:join` → muallif `live:viewer-joined` { liveId, user } megirad va
 * ba tamoshobin offer mefiristad (`live:signal`); tamoshobin answer bar megardonad.
 */
@Injectable()
export class LiveService implements OnModuleInit {
  /** liveId → userId-hoi tamoshobin (dar xotira; efir — faqat to restart-i server) */
  private readonly viewers = new Map<number, Set<string>>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
    private readonly follows: FollowsService,
    private readonly relations: RelationsService,
    private readonly notifications: NotificationsService,
  ) {}

  async onModuleInit() {
    this.realtime.on(ClientEvent.LIVE_JOIN, (userId, body, client) => this.join(userId, body, client));
    this.realtime.on(ClientEvent.LIVE_LEAVE, (userId, body, client) => this.leaveEvent(userId, body, client));
    this.realtime.on(ClientEvent.LIVE_SIGNAL, (userId, body) => this.signal(userId, body));
    this.realtime.on(ClientEvent.LIVE_HEART, (userId, body) => this.heart(userId, body));
    // Tamoshobin socket-ro bast → az efir baromad
    this.realtime.onDisconnect((userId, client) => {
      for (const liveId of (client.data.liveIds as Set<number> | undefined) ?? []) this.removeViewer(liveId, userId);
    });
    // Muallif offline shud → efir tamom
    this.realtime.onOffline(async (userId) => {
      const lives = await this.prisma.liveStream.findMany({ where: { userId, status: 'LIVE' }, select: { id: true } });
      for (const l of lives) await this.end(userId, l.id);
    });
    // Pas az restart-i server tamoshobinho nestand — efirhoi kuhna tamom
    await this.prisma.liveStream
      .updateMany({ where: { status: 'LIVE' }, data: { status: 'ENDED', endedAt: new Date() } })
      .catch(() => undefined);
  }

  private toDto(l: LiveRow): LiveDto {
    return {
      liveId: l.id,
      user: toUserShort(l.user),
      title: l.title,
      status: l.status,
      startedAt: l.startedAt.toISOString(),
      endedAt: l.endedAt?.toISOString() ?? null,
      viewerCount: this.viewers.get(l.id)?.size ?? 0,
      peakViewers: l.peakViewers,
    };
  }

  private async load(liveId: number) {
    const live = await this.prisma.liveStream.findUnique({ where: { id: liveId }, include: liveInclude });
    if (!live) throw notFound(ErrorCode.LIVE_NOT_FOUND);
    return live;
  }

  /** Dastrasi: blok — nest, hisobi private — faqat follower-ho */
  private async loadVisible(me: string, liveId: number) {
    const live = await this.load(liveId);
    if (!(await this.follows.canView(me, live.userId))) throw notFound(ErrorCode.LIVE_NOT_FOUND);
    return live;
  }

  async start(me: string, dto: StartLiveDto): Promise<LiveDto> {
    const existing = await this.prisma.liveStream.findFirst({ where: { userId: me, status: 'LIVE' } });
    if (existing) throw new AppException(HttpStatus.CONFLICT, ErrorCode.LIVE_ALREADY_STARTED);
    const live = await this.prisma.liveStream.create({ data: { userId: me, title: dto.title || null }, include: liveInclude });
    this.viewers.set(live.id, new Set());
    const result = this.toDto(live);
    // Follower-ho: notification "started a live video" + `live:started`
    const blocked = new Set(await this.relations.blockedIds(me));
    const followers = (await this.prisma.follow.findMany({ where: { followingId: me }, select: { followerId: true } }))
      .map((f) => f.followerId)
      .filter((id) => !blocked.has(id));
    followers.forEach((id) => this.realtime.emitToUser(id, SocketEvent.LIVE_STARTED, result));
    void Promise.all(followers.map((recipientId) => this.notifications.notify({ type: 'LIVE_STARTED', actorId: me, recipientId })));
    return result;
  }

  async end(me: string, liveId: number): Promise<LiveDto> {
    const live = await this.load(liveId);
    if (live.userId !== me) throw forbidden(ErrorCode.NOT_OWNER);
    if (live.status === 'ENDED') return this.toDto(live);
    const ended = await this.prisma.liveStream.update({
      where: { id: liveId },
      data: { status: 'ENDED', endedAt: new Date() },
      include: liveInclude,
    });
    const dto = this.toDto(ended);
    this.realtime.server?.to(liveRoom(liveId)).emit(SocketEvent.LIVE_ENDED, dto);
    this.realtime.server?.in(liveRoom(liveId)).socketsLeave(liveRoom(liveId));
    this.viewers.delete(liveId);
    return { ...dto, viewerCount: 0 };
  }

  async getById(me: string, liveId: number): Promise<LiveDto> {
    return this.toDto(await this.loadVisible(me, liveId));
  }

  /** Efirhoi faoli userhoe ki man follow mekunam (+ efiri xudam) — baroi qatori story */
  async active(me: string): Promise<LiveDto[]> {
    const blocked = await this.relations.blockedIds(me);
    const rows = await this.prisma.liveStream.findMany({
      where: {
        status: 'LIVE',
        userId: { notIn: blocked },
        OR: [{ userId: me }, { user: { followers: { some: { followerId: me } } } }],
      },
      orderBy: { startedAt: 'desc' },
      include: liveInclude,
    });
    return rows.map((r) => this.toDto(r));
  }

  async addComment(me: string, liveId: number, text: string): Promise<LiveCommentDto> {
    const live = await this.loadVisible(me, liveId);
    if (live.status !== 'LIVE') throw badRequest(ErrorCode.LIVE_NOT_ACTIVE);
    const c = await this.prisma.liveComment.create({ data: { liveId, userId: me, text }, include: { user: { select: userShortSelect } } });
    const dto: LiveCommentDto = { id: c.id, liveId, user: toUserShort(c.user), text: c.text, createdAt: c.createdAt.toISOString() };
    this.realtime.server?.to(liveRoom(liveId)).emit(SocketEvent.LIVE_COMMENT, dto);
    // Muallif dar room nest (vay tamoshobin nest) — alohida
    this.realtime.emitToUser(live.userId, SocketEvent.LIVE_COMMENT, dto);
    return dto;
  }

  /** 100 comment-i oxirin (kuhna avval) */
  async comments(me: string, liveId: number): Promise<LiveCommentDto[]> {
    await this.loadVisible(me, liveId);
    const rows = await this.prisma.liveComment.findMany({
      where: { liveId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { user: { select: userShortSelect } },
    });
    return rows.reverse().map((c) => ({ id: c.id, liveId, user: toUserShort(c.user), text: c.text, createdAt: c.createdAt.toISOString() }));
  }

  private broadcastViewers(liveId: number, ownerId: string) {
    const payload = { liveId, viewerCount: this.viewers.get(liveId)?.size ?? 0 };
    this.realtime.server?.to(liveRoom(liveId)).emit(SocketEvent.LIVE_VIEWERS, payload);
    this.realtime.emitToUser(ownerId, SocketEvent.LIVE_VIEWERS, payload);
  }

  /** Socket `live:join` → ack { ok, data: LiveDto } */
  private async join(me: string, body: unknown, client: Socket) {
    const parsed = liveRoomSchema.safeParse(body);
    if (!parsed.success) throw badRequest(ErrorCode.VALIDATION_ERROR);
    const live = await this.loadVisible(me, parsed.data.liveId);
    if (live.status !== 'LIVE') throw badRequest(ErrorCode.LIVE_NOT_ACTIVE);
    if (live.userId === me) throw badRequest(ErrorCode.VALIDATION_ERROR);
    const set = this.viewers.get(live.id) ?? new Set<string>();
    this.viewers.set(live.id, set);
    if (!set.has(me) && set.size >= LIVE_MAX_VIEWERS) throw new AppException(HttpStatus.BAD_REQUEST, ErrorCode.LIVE_FULL);
    set.add(me);
    await client.join(liveRoom(live.id));
    const ids = (client.data.liveIds as Set<number> | undefined) ?? new Set<number>();
    ids.add(live.id);
    client.data.liveIds = ids;
    if (set.size > live.peakViewers) {
      await this.prisma.liveStream.update({ where: { id: live.id }, data: { peakViewers: set.size } });
    }
    const viewer = await this.prisma.user.findUniqueOrThrow({ where: { id: me }, select: userShortSelect });
    this.realtime.emitToUser(live.userId, SocketEvent.LIVE_VIEWER_JOINED, { liveId: live.id, user: toUserShort(viewer) });
    this.broadcastViewers(live.id, live.userId);
    return this.toDto(await this.load(live.id));
  }

  private async leaveEvent(me: string, body: unknown, client: Socket) {
    const parsed = liveRoomSchema.safeParse(body);
    if (!parsed.success) throw badRequest(ErrorCode.VALIDATION_ERROR);
    await client.leave(liveRoom(parsed.data.liveId));
    (client.data.liveIds as Set<number> | undefined)?.delete(parsed.data.liveId);
    this.removeViewer(parsed.data.liveId, me);
  }

  private removeViewer(liveId: number, userId: string) {
    const set = this.viewers.get(liveId);
    if (!set?.delete(userId)) return;
    void this.prisma.liveStream.findUnique({ where: { id: liveId }, select: { userId: true } }).then((l) => {
      if (!l) return;
      this.realtime.emitToUser(l.userId, SocketEvent.LIVE_VIEWER_LEFT, { liveId, userId });
      this.broadcastViewers(liveId, l.userId);
    });
  }

  /** Socket `live:signal`: faqat muallif ↔ tamoshobini hamin efir */
  private async signal(me: string, body: unknown) {
    const parsed = liveSignalSchema.safeParse(body);
    if (!parsed.success) throw badRequest(ErrorCode.VALIDATION_ERROR);
    const { liveId, toUserId, signal } = parsed.data;
    const live = await this.load(liveId);
    if (live.status !== 'LIVE') throw badRequest(ErrorCode.LIVE_NOT_ACTIVE);
    const set = this.viewers.get(liveId);
    const allowed = (me === live.userId && set?.has(toUserId)) || (toUserId === live.userId && set?.has(me));
    if (!allowed) throw forbidden(ErrorCode.FORBIDDEN);
    this.realtime.emitToUser(toUserId, SocketEvent.LIVE_SIGNAL, { liveId, fromUserId: me, signal });
  }

  /** Socket `live:heart`: dil-ho dar ekran (dar DB nigoh doshta nameshavand) */
  private async heart(me: string, body: unknown) {
    const parsed = liveRoomSchema.safeParse(body);
    if (!parsed.success) throw badRequest(ErrorCode.VALIDATION_ERROR);
    const live = await this.load(parsed.data.liveId);
    if (live.status !== 'LIVE' || !this.viewers.get(live.id)?.has(me)) throw badRequest(ErrorCode.LIVE_NOT_ACTIVE);
    const payload = { liveId: live.id, userId: me };
    this.realtime.server?.to(liveRoom(live.id)).emit(SocketEvent.LIVE_HEART, payload);
    this.realtime.emitToUser(live.userId, SocketEvent.LIVE_HEART, payload);
  }
}

import { HttpStatus, Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { CallStatus, Prisma } from '@prisma/client';
import {
  CALL_RING_TIMEOUT_MS,
  CallDto,
  ClientEvent,
  ErrorCode,
  IceServer,
  PaginationQuery,
  SocketEvent,
  StartCallDto,
  callSignalSchema,
} from '@repo/shared';
import { AppException, badRequest, forbidden, notFound } from '../../common/app-exception';
import { toUserShort, userShortSelect } from '../../common/mappers';
import { paged, skipTake } from '../../common/response';
import { APP_CONFIG, AppConfig } from '../../infra/config';
import { PrismaService } from '../../infra/prisma.service';
import { ChatService, callDurationSec } from '../chat/chat.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { RelationsService } from '../relations/relations.service';

const callInclude = {
  caller: { select: userShortSelect },
  chat: { select: { isGroup: true, title: true } },
  participants: { include: { user: { select: userShortSelect } } },
} satisfies Prisma.CallInclude;
type CallRow = Prisma.CallGetPayload<{ include: typeof callInclude }>;

const ACTIVE: CallStatus[] = ['RINGING', 'ONGOING'];

/**
 * Zangi audio / video dar Direct (Spec 16 §2).
 * Holat: RINGING → ONGOING (kase qabul kard) → ENDED; bidun javob 45 s → MISSED; 1:1 rad → DECLINED.
 * Media — WebRTC bayni brauzerho; server offer / answer / ICE-ro faqat bayni ishtirokchiyoni zang meguzaronad.
 */
@Injectable()
export class CallsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CallsService.name);
  private readonly ringTimers = new Map<number, NodeJS.Timeout>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
    private readonly chat: ChatService,
    private readonly relations: RelationsService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  onModuleInit() {
    this.realtime.on(ClientEvent.CALL_SIGNAL, (userId, body) => this.signal(userId, body));
    // Hamai socket-hoi user qat' shud → az zangi faol mebaroyad
    this.realtime.onOffline(async (userId) => {
      const calls = await this.prisma.callParticipant.findMany({
        where: { userId, leftAt: null, call: { status: { in: ACTIVE } } },
        select: { callId: true },
      });
      for (const c of calls) await this.leave(userId, c.callId).catch(() => undefined);
    });
  }

  onModuleDestroy() {
    this.ringTimers.forEach((t) => clearTimeout(t));
  }

  private toDto(c: CallRow): CallDto {
    return {
      callId: c.id,
      chatId: c.chatId,
      type: c.type,
      status: c.status,
      caller: toUserShort(c.caller),
      participants: c.participants.map((p) => ({
        ...toUserShort(p.user),
        joinedAt: p.joinedAt?.toISOString() ?? null,
        leftAt: p.leftAt?.toISOString() ?? null,
      })),
      isGroup: c.chat.isGroup,
      title: c.chat.title,
      createdAt: c.createdAt.toISOString(),
      answeredAt: c.answeredAt?.toISOString() ?? null,
      endedAt: c.endedAt?.toISOString() ?? null,
      durationSec: callDurationSec(c),
    };
  }

  private emit(userIds: string[], event: string, payload: unknown) {
    userIds.forEach((id) => this.realtime.emitToUser(id, event, payload));
  }

  private async load(callId: number) {
    const call = await this.prisma.call.findUnique({ where: { id: callId }, include: callInclude });
    if (!call) throw notFound(ErrorCode.CALL_NOT_FOUND);
    return call;
  }

  /** Faqat ishtirokchii zang */
  private async loadForMember(me: string, callId: number) {
    const call = await this.load(callId);
    if (!call.participants.some((p) => p.userId === me)) throw forbidden(ErrorCode.FORBIDDEN);
    return call;
  }

  /** Dar zang hast: qabul karda va hanuz nabaromada */
  private inCall = (c: CallRow, userId: string) => c.participants.some((p) => p.userId === userId && p.joinedAt && !p.leftAt);

  /** `GET /Call/get-ice-servers`: STUN (ozod) + TURN agar dar .env boshad */
  iceServers(): IceServer[] {
    const list = (v?: string) => (v ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    const servers: IceServer[] = [];
    const stun = list(this.config.STUN_URLS);
    if (stun.length) servers.push({ urls: stun });
    const turn = list(this.config.TURN_URLS);
    if (turn.length) servers.push({ urls: turn, username: this.config.TURN_USERNAME, credential: this.config.TURN_CREDENTIAL });
    return servers;
  }

  async start(me: string, dto: StartCallDto): Promise<CallDto> {
    const chat = await this.chat.assertMember(me, dto.chatId);
    if (!chat.isGroup && (await this.relations.isBlockedEither(me, chat.peers[0]!))) throw forbidden(ErrorCode.BLOCKED);
    const busy = await this.prisma.callParticipant.count({
      where: { userId: me, joinedAt: { not: null }, leftAt: null, call: { status: { in: ACTIVE } } },
    });
    if (busy) throw new AppException(HttpStatus.CONFLICT, ErrorCode.CALL_BUSY);
    const now = new Date();
    const call = await this.prisma.call.create({
      data: {
        chatId: dto.chatId,
        callerId: me,
        type: dto.type,
        participants: { create: [{ userId: me, joinedAt: now }, ...chat.peers.map((userId) => ({ userId }))] },
      },
      include: callInclude,
    });
    const result = this.toDto(call);
    this.emit(chat.peers, SocketEvent.CALL_INCOMING, result);
    // Bidun javob → MISSED
    this.ringTimers.set(
      call.id,
      setTimeout(() => {
        this.ringTimers.delete(call.id);
        this.finish(call.id, 'MISSED').catch((err: Error) => this.logger.warn({ err }, 'Zang qat\' nashud'));
      }, CALL_RING_TIMEOUT_MS).unref(),
    );
    return result;
  }

  /**
   * Qabul (yo ba zangi group-i ONGOING ilova shudan). Ba ishtirokchiyoni dar zang `call:accepted` { call, userId } meravad.
   * Tartibi WebRTC: **ilovashavanda** ba har ishtirokchii dar zang offer mefiristad.
   */
  async accept(me: string, callId: number): Promise<CallDto> {
    const call = await this.loadForMember(me, callId);
    if (!ACTIVE.includes(call.status)) throw badRequest(ErrorCode.CALL_NOT_ACTIVE);
    if (this.inCall(call, me)) return this.toDto(call);
    const busy = await this.prisma.callParticipant.count({
      where: { userId: me, callId: { not: callId }, joinedAt: { not: null }, leftAt: null, call: { status: { in: ACTIVE } } },
    });
    if (busy) throw new AppException(HttpStatus.CONFLICT, ErrorCode.CALL_BUSY);
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.callParticipant.update({ where: { callId_userId: { callId, userId: me } }, data: { joinedAt: now, leftAt: null } }),
      this.prisma.call.update({ where: { id: callId }, data: { status: 'ONGOING', answeredAt: call.answeredAt ?? now } }),
    ]);
    this.clearRing(callId);
    const dto = this.toDto(await this.load(callId));
    const others = call.participants.filter((p) => p.userId !== me).map((p) => p.userId);
    this.emit(others, SocketEvent.CALL_ACCEPTED, { call: dto, userId: me });
    return dto;
  }

  /** Rad kardan: 1:1 → DECLINED (zang tamom); group → faqat man */
  async decline(me: string, callId: number): Promise<CallDto> {
    const call = await this.loadForMember(me, callId);
    if (!ACTIVE.includes(call.status)) throw badRequest(ErrorCode.CALL_NOT_ACTIVE);
    if (call.callerId === me || this.inCall(call, me)) return this.leave(me, callId);
    await this.prisma.callParticipant.update({ where: { callId_userId: { callId, userId: me } }, data: { leftAt: new Date() } });
    const others = call.participants.filter((p) => p.userId !== me).map((p) => p.userId);
    if (!call.chat.isGroup) return this.finish(callId, 'DECLINED');
    const dto = this.toDto(await this.load(callId));
    this.emit(others, SocketEvent.CALL_DECLINED, { call: dto, userId: me });
    // Hama rad kardand → MISSED
    const waiting = dto.participants.some((p) => p.id !== call.callerId && !p.leftAt);
    return waiting ? dto : this.finish(callId, 'MISSED');
  }

  /** Baromadan (yo bekor kardani zang az tarafi zangzananda). Agar dar zang < 2 nafar monad — zang tamom. */
  async leave(me: string, callId: number): Promise<CallDto> {
    const call = await this.loadForMember(me, callId);
    if (!ACTIVE.includes(call.status)) return this.toDto(call);
    await this.prisma.callParticipant.update({ where: { callId_userId: { callId, userId: me } }, data: { leftAt: new Date() } });
    const fresh = await this.load(callId);
    const remaining = fresh.participants.filter((p) => p.joinedAt && !p.leftAt);
    // Kase qabul nakarda bud → bekor (MISSED baroi digaron)
    if (fresh.status === 'RINGING') {
      if (me === call.callerId) return this.finish(callId, 'MISSED');
      return this.toDto(fresh);
    }
    if (remaining.length < 2) return this.finish(callId, 'ENDED');
    const dto = this.toDto(fresh);
    this.emit(
      fresh.participants.filter((p) => p.userId !== me).map((p) => p.userId),
      SocketEvent.CALL_LEFT,
      { call: dto, userId: me },
    );
    return dto;
  }

  /** Anjomi zang: status, endedAt, `call:ended` ba hama va paymi "zang" dar chat */
  private async finish(callId: number, status: CallStatus): Promise<CallDto> {
    this.clearRing(callId);
    const now = new Date();
    const { count } = await this.prisma.call.updateMany({
      where: { id: callId, status: { in: ACTIVE } },
      data: { status, endedAt: now },
    });
    const call = await this.load(callId);
    if (count === 0) return this.toDto(call);
    await this.prisma.callParticipant.updateMany({ where: { callId, joinedAt: { not: null }, leftAt: null }, data: { leftAt: now } });
    const dto = this.toDto(await this.load(callId));
    this.emit(dto.participants.map((p) => p.id), SocketEvent.CALL_ENDED, dto);
    await this.chat.addCallMessage(call.chatId, call.callerId, callId).catch((err: Error) => this.logger.warn({ err }, 'Paymi zang sohta nashud'));
    return dto;
  }

  private clearRing(callId: number) {
    const t = this.ringTimers.get(callId);
    if (t) clearTimeout(t);
    this.ringTimers.delete(callId);
  }

  async getById(me: string, callId: number): Promise<CallDto> {
    return this.toDto(await this.loadForMember(me, callId));
  }

  /** Zanghoi faoli man (masalan, pas az refresh — zangi voridshavanda) */
  async active(me: string): Promise<CallDto[]> {
    const rows = await this.prisma.call.findMany({
      where: { status: { in: ACTIVE }, participants: { some: { userId: me, leftAt: null } } },
      orderBy: { createdAt: 'desc' },
      include: callInclude,
    });
    return rows.map((r) => this.toDto(r));
  }

  /** Ta'rixi zangho (nav avval) */
  async history(me: string, q: PaginationQuery) {
    const where: Prisma.CallWhereInput = { participants: { some: { userId: me } } };
    const [rows, total] = await Promise.all([
      this.prisma.call.findMany({ where, orderBy: { createdAt: 'desc' }, include: callInclude, ...skipTake(q) }),
      this.prisma.call.count({ where }),
    ]);
    return paged(
      rows.map((r) => this.toDto(r)),
      total,
      q,
    );
  }

  /** Socket `call:signal`: offer / answer / ICE faqat bayni ishtirokchiyoni zangi faol */
  private async signal(me: string, body: unknown) {
    const parsed = callSignalSchema.safeParse(body);
    if (!parsed.success) throw badRequest(ErrorCode.VALIDATION_ERROR);
    const { callId, toUserId, signal } = parsed.data;
    const call = await this.loadForMember(me, callId);
    if (!ACTIVE.includes(call.status)) throw badRequest(ErrorCode.CALL_NOT_ACTIVE);
    if (!call.participants.some((p) => p.userId === toUserId) || toUserId === me) throw forbidden(ErrorCode.FORBIDDEN);
    this.realtime.emitToUser(toUserId, SocketEvent.CALL_SIGNAL, { callId, fromUserId: me, signal });
  }
}

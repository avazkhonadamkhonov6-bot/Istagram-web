import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { ClientEvent, ErrorCode, SocketEvent, typingSchema } from '@repo/shared';
import type { Server, Socket } from 'socket.io';
import { AppException } from '../../common/app-exception';
import { JwtPayload } from '../../common/guards/jwt-auth.guard';
import { PrismaService } from '../../infra/prisma.service';

export const userRoom = (userId: string) => `user:${userId}`;

/** Handler-i event-i client → server; natija ba ack meravad: `{ ok: true, data }` yo `{ ok: false, code }` */
export type SocketHandler = (userId: string, body: unknown, client: Socket) => Promise<unknown>;
export type SocketAck = { ok: true; data?: unknown } | { ok: false; code: string };

/** Yak gateway-i umumi (Spec 08). Auth: `io(url, { path: '/ws', auth: { token: <ws-ticket> } })`. */
@WebSocketGateway({ path: '/ws', cors: { origin: (process.env.WEB_ORIGIN ?? 'http://localhost:3000').split(',').map((o) => o.trim()), credentials: true } })
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  /** Pas az chand ms bidun socket user "offline" hisob meshavad (refresh-i sahifa zangro qat' namekunad) */
  static offlineGraceMs = 15_000;

  // Modulhoi digar (zang, efir) handler-i xudro sabt mekunand — gateway az onho vobasta nest
  private readonly handlers = new Map<string, SocketHandler>();
  private readonly disconnectHandlers: ((userId: string, client: Socket) => void)[] = [];
  private readonly offlineHandlers: ((userId: string) => Promise<void>)[] = [];

  on(event: string, handler: SocketHandler) {
    this.handlers.set(event, handler);
  }

  /** Har socket-i user qat' shud (masalan, tamoshobin az efir) */
  onDisconnect(handler: (userId: string, client: Socket) => void) {
    this.disconnectHandlers.push(handler);
  }

  /** User dar hech dastgoh socket nadorad (pas az `offlineGraceMs`) */
  onOffline(handler: (userId: string) => Promise<void>) {
    this.offlineHandlers.push(handler);
  }

  private async dispatch(event: string, client: Socket, body: unknown): Promise<SocketAck> {
    await (client.data.ready as Promise<void> | undefined);
    const userId = client.data.userId as string | undefined;
    const handler = this.handlers.get(event);
    if (!userId) return { ok: false, code: ErrorCode.UNAUTHORIZED };
    if (!handler) return { ok: false, code: ErrorCode.VALIDATION_ERROR };
    try {
      const data = await handler(userId, body, client);
      return data === undefined ? { ok: true } : { ok: true, data };
    } catch (err) {
      if (err instanceof AppException) return { ok: false, code: err.code };
      this.logger.warn({ err, event }, 'Xato dar event-i socket');
      return { ok: false, code: 'INTERNAL_ERROR' };
    }
  }

  @SubscribeMessage(ClientEvent.CALL_SIGNAL)
  onCallSignal(@ConnectedSocket() client: Socket, @MessageBody() body: unknown) {
    return this.dispatch(ClientEvent.CALL_SIGNAL, client, body);
  }

  @SubscribeMessage(ClientEvent.LIVE_JOIN)
  onLiveJoin(@ConnectedSocket() client: Socket, @MessageBody() body: unknown) {
    return this.dispatch(ClientEvent.LIVE_JOIN, client, body);
  }

  @SubscribeMessage(ClientEvent.LIVE_LEAVE)
  onLiveLeave(@ConnectedSocket() client: Socket, @MessageBody() body: unknown) {
    return this.dispatch(ClientEvent.LIVE_LEAVE, client, body);
  }

  @SubscribeMessage(ClientEvent.LIVE_SIGNAL)
  onLiveSignal(@ConnectedSocket() client: Socket, @MessageBody() body: unknown) {
    return this.dispatch(ClientEvent.LIVE_SIGNAL, client, body);
  }

  @SubscribeMessage(ClientEvent.LIVE_HEART)
  onLiveHeart(@ConnectedSocket() client: Socket, @MessageBody() body: unknown) {
    return this.dispatch(ClientEvent.LIVE_HEART, client, body);
  }

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    // Event-hoe ki client favran pas az connect mefiristad, to anjomi auth intizor meshavand (dispatch)
    client.data.ready = this.authenticate(client);
    await client.data.ready;
  }

  private async authenticate(client: Socket) {
    const raw = (client.handshake.auth as { token?: unknown })?.token;
    const token = typeof raw === 'string' ? raw : '';
    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);
      // Faqat ticket-i kutoh (POST /Account/ws-ticket), ne JWT-i asosi
      if (payload.typ !== 'ws') throw new Error('not a ws ticket');
      client.data.userId = payload.sub;
      await client.join(userRoom(payload.sub));
      await this.touch(payload.sub);
    } catch {
      // Tokeni galat → qat' (Spec 08 AC4)
      this.logger.debug(`Socket rad shud: ${client.id}`);
      client.disconnect(true);
    }
  }

  /** "Active now" (Spec 15 §4): vaqti oxirini faoliyat — dar connect va disconnect */
  async handleDisconnect(client: Socket) {
    const userId = client.data.userId as string | undefined;
    if (!userId) return;
    await this.touch(userId);
    this.disconnectHandlers.forEach((h) => h(userId, client));
    setTimeout(() => {
      if (this.isOnline(userId)) return;
      for (const h of this.offlineHandlers) h(userId).catch((err: Error) => this.logger.warn({ err }, 'Xato dar offline-handler'));
    }, RealtimeGateway.offlineGraceMs).unref();
  }

  private async touch(userId: string) {
    await this.prisma.user.updateMany({ where: { id: userId }, data: { lastActiveAt: new Date() } }).catch(() => undefined);
  }

  /** User hozir socket-i kushoda dorad? */
  isOnline(userId: string) {
    return (this.server?.sockets?.adapter?.rooms?.get(userRoom(userId))?.size ?? 0) > 0;
  }

  /** Typing (Spec 13 §4): faqat ishtirokchi; ba tarafi digar meravad */
  @SubscribeMessage(SocketEvent.TYPING)
  async onTyping(@ConnectedSocket() client: Socket, @MessageBody() body: unknown) {
    const userId = client.data.userId as string | undefined;
    const parsed = typingSchema.safeParse(body);
    if (!userId || !parsed.success) return;
    const chat = await this.prisma.chat.findUnique({
      where: { id: parsed.data.chatId },
      select: { sendUserId: true, receiveUserId: true, isGroup: true, members: { select: { userId: true } } },
    });
    if (!chat) return;
    // Group chat (Spec 14 §4): ba hamai a'zoi digar
    const members = chat.isGroup ? chat.members.map((m) => m.userId) : [chat.sendUserId, chat.receiveUserId];
    if (!members.includes(userId)) return;
    members.filter((id) => id !== userId).forEach((id) => this.emitToUser(id, SocketEvent.TYPING, { ...parsed.data, userId }));
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    this.server?.to(userRoom(userId)).emit(event, payload);
  }
}

import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { SocketEvent, typingSchema } from '@repo/shared';
import type { Server, Socket } from 'socket.io';
import { JwtPayload } from '../../common/guards/jwt-auth.guard';
import { PrismaService } from '../../infra/prisma.service';

export const userRoom = (userId: string) => `user:${userId}`;

/** Yak gateway-i umumi (Spec 08). Auth: `io(url, { path: '/ws', auth: { token: <ws-ticket> } })`. */
@WebSocketGateway({ path: '/ws', cors: { origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000', credentials: true } })
export class RealtimeGateway implements OnGatewayConnection {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    const raw = (client.handshake.auth as { token?: unknown })?.token;
    const token = typeof raw === 'string' ? raw : '';
    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);
      // Faqat ticket-i kutoh (POST /Account/ws-ticket), ne JWT-i asosi
      if (payload.typ !== 'ws') throw new Error('not a ws ticket');
      client.data.userId = payload.sub;
      await client.join(userRoom(payload.sub));
    } catch {
      // Tokeni galat → qat' (Spec 08 AC4)
      this.logger.debug(`Socket rad shud: ${client.id}`);
      client.disconnect(true);
    }
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

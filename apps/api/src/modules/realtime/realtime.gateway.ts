import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { JwtPayload } from '../../common/guards/jwt-auth.guard';

export const userRoom = (userId: string) => `user:${userId}`;

/** Yak gateway-i umumi (Spec 08). Auth: `io(url, { path: '/ws', auth: { token: <ws-ticket> } })`. */
@WebSocketGateway({ path: '/ws', cors: { origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000', credentials: true } })
export class RealtimeGateway implements OnGatewayConnection {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(private readonly jwt: JwtService) {}

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

  emitToUser(userId: string, event: string, payload: unknown) {
    this.server?.to(userRoom(userId)).emit(event, payload);
  }
}

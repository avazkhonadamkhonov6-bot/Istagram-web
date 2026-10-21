import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { JwtPayload } from '../../common/guards/jwt-auth.guard';

export const userRoom = (userId: string) => `user:${userId}`;

/** Yak gateway-i umumi (Spec 08). Auth: `io(url, { path: '/ws', auth: { token } })`. */
@WebSocketGateway({ path: '/ws', cors: { origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000', credentials: true } })
export class RealtimeGateway implements OnGatewayConnection {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(private readonly jwt: JwtService) {}

  async handleConnection(client: Socket) {
    const raw = (client.handshake.auth as { token?: unknown })?.token ?? client.handshake.headers.authorization;
    const token = typeof raw === 'string' ? raw.replace(/^Bearer\s+/i, '') : '';
    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);
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

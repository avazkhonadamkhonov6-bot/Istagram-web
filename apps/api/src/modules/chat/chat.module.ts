import { Module } from '@nestjs/common';
import { RealtimeModule } from '../realtime/realtime.module';
import { RelationsModule } from '../relations/relations.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [RealtimeModule, RelationsModule],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}

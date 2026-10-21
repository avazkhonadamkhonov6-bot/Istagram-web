import { Module } from '@nestjs/common';
import { ChatModule } from '../chat/chat.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { RelationsModule } from '../relations/relations.module';
import { CallsController } from './calls.controller';
import { CallsService } from './calls.service';

@Module({
  imports: [RealtimeModule, RelationsModule, ChatModule],
  controllers: [CallsController],
  providers: [CallsService],
})
export class CallsModule {}

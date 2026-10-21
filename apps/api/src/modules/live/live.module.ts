import { Module } from '@nestjs/common';
import { FollowsModule } from '../follows/follows.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { RelationsModule } from '../relations/relations.module';
import { LiveController } from './live.controller';
import { LiveService } from './live.service';

@Module({
  imports: [RealtimeModule, RelationsModule, FollowsModule, NotificationsModule],
  controllers: [LiveController],
  providers: [LiveService],
})
export class LiveModule {}

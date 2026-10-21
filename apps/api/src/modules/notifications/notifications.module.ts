import { Module } from '@nestjs/common';
import { RealtimeModule } from '../realtime/realtime.module';
import { RelationsModule } from '../relations/relations.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [RealtimeModule, RelationsModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}

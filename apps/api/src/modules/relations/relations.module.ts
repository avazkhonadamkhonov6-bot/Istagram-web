import { Module } from '@nestjs/common';
import { RealtimeModule } from '../realtime/realtime.module';
import { RelationsController, ReportController } from './relations.controller';
import { RelationsService } from './relations.service';

@Module({
  imports: [RealtimeModule],
  controllers: [RelationsController, ReportController],
  providers: [RelationsService],
  exports: [RelationsService],
})
export class RelationsModule {}

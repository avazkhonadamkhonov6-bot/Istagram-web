import { Module } from '@nestjs/common';
import { RelationsController, ReportController } from './relations.controller';
import { RelationsService } from './relations.service';

@Module({
  controllers: [RelationsController, ReportController],
  providers: [RelationsService],
  exports: [RelationsService],
})
export class RelationsModule {}

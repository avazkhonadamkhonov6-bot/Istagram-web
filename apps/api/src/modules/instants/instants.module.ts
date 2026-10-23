import { Module } from '@nestjs/common';
import { RealtimeModule } from '../realtime/realtime.module';
import { RelationsModule } from '../relations/relations.module';
import { InstantsController } from './instants.controller';
import { InstantsService } from './instants.service';

@Module({
  imports: [RealtimeModule, RelationsModule],
  controllers: [InstantsController],
  providers: [InstantsService],
})
export class InstantsModule {}

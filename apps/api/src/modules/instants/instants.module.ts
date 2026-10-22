import { Module } from '@nestjs/common';
import { RelationsModule } from '../relations/relations.module';
import { InstantsController } from './instants.controller';
import { InstantsService } from './instants.service';

@Module({
  imports: [RelationsModule],
  controllers: [InstantsController],
  providers: [InstantsService],
})
export class InstantsModule {}

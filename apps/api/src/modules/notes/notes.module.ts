import { Module } from '@nestjs/common';
import { RelationsModule } from '../relations/relations.module';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';

@Module({
  imports: [RelationsModule],
  controllers: [NotesController],
  providers: [NotesService],
})
export class NotesModule {}

import { Body, Controller, Delete, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AddNoteDto, addNoteSchema } from '@repo/shared';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodPipe } from '../../common/pipes/zod.pipe';
import { ok } from '../../common/response';
import { NotesService } from './notes.service';

/** Spec 15 §5 */
@ApiTags('Note')
@Controller('Note')
export class NotesController {
  constructor(private readonly notes: NotesService) {}

  @Get('get-notes')
  async list(@CurrentUser() me: AuthUser) {
    return ok(await this.notes.list(me.id));
  }

  @Post('add-note')
  async add(@CurrentUser() me: AuthUser, @Body(new ZodPipe(addNoteSchema)) dto: AddNoteDto) {
    return ok(await this.notes.add(me.id, dto));
  }

  @Delete('delete-note')
  async remove(@CurrentUser() me: AuthUser) {
    return ok(await this.notes.remove(me.id));
  }
}

import { Controller, Delete, Get, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { addInstantQuerySchema, instantIdQuerySchema } from '@repo/shared';
import type { z } from 'zod';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodPipe } from '../../common/pipes/zod.pipe';
import { ok } from '../../common/response';
import { uploadLimits } from '../../common/upload';
import { InstantsService } from './instants.service';

/** Spec 17 */
@ApiTags('Instant')
@Controller('Instant')
export class InstantsController {
  constructor(private readonly instants: InstantsService) {}

  @Get('get-instants')
  async inbox(@CurrentUser() me: AuthUser) {
    return ok(await this.instants.inbox(me.id));
  }

  @Get('get-instant-archive')
  async archive(@CurrentUser() me: AuthUser) {
    return ok(await this.instants.archive(me.id));
  }

  @Post('add-instant')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('Image', { limits: uploadLimits }))
  async add(
    @CurrentUser() me: AuthUser,
    @Query(new ZodPipe(addInstantQuerySchema)) q: z.infer<typeof addInstantQuerySchema>,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return ok(await this.instants.add(me.id, file, q.CloseFriends));
  }

  @Post('view-instant')
  async view(@CurrentUser() me: AuthUser, @Query(new ZodPipe(instantIdQuerySchema)) q: z.infer<typeof instantIdQuerySchema>) {
    return ok(await this.instants.view(me.id, q.id));
  }

  @Delete('delete-instant')
  async remove(@CurrentUser() me: AuthUser, @Query(new ZodPipe(instantIdQuerySchema)) q: z.infer<typeof instantIdQuerySchema>) {
    return ok(await this.instants.remove(me.id, q.id));
  }
}

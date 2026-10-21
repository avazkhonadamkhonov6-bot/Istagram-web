import { Controller, Delete, Get, Param, ParseUUIDPipe, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { addStoryQuerySchema, intIdQuerySchema, storyIdQuerySchema, storyViewQuerySchema } from '@repo/shared';
import type { z } from 'zod';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodPipe } from '../../common/pipes/zod.pipe';
import { ok } from '../../common/response';
import { uploadLimits } from '../../common/upload';
import { StoriesService } from './stories.service';

@ApiTags('Story')
@Controller('Story')
export class StoriesController {
  constructor(private readonly stories: StoriesService) {}

  @Get('get-stories')
  async feed(@CurrentUser() me: AuthUser) {
    return ok(await this.stories.feed(me.id));
  }

  @Get('get-user-stories/:userId')
  async forUser(@CurrentUser() me: AuthUser, @Param('userId', new ParseUUIDPipe()) userId: string) {
    return ok(await this.stories.forUser(me.id, userId));
  }

  @Get('get-my-stories')
  async mine(@CurrentUser() me: AuthUser) {
    return ok(await this.stories.forUser(me.id, me.id));
  }

  @Post('LikeStory')
  async like(@CurrentUser() me: AuthUser, @Query(new ZodPipe(storyIdQuerySchema)) q: z.infer<typeof storyIdQuerySchema>) {
    return ok(await this.stories.toggleLike(me.id, q.storyId));
  }

  @Get('GetStoryById')
  async getById(@CurrentUser() me: AuthUser, @Query(new ZodPipe(intIdQuerySchema)) q: { id: number }) {
    return ok(await this.stories.getById(me.id, q.id));
  }

  @Post('AddStories')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('Image', { limits: uploadLimits }))
  async add(
    @CurrentUser() me: AuthUser,
    @Query(new ZodPipe(addStoryQuerySchema)) q: z.infer<typeof addStoryQuerySchema>,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return ok(await this.stories.add(me.id, file, q.PostId));
  }

  @Delete('DeleteStory')
  async remove(@CurrentUser() me: AuthUser, @Query(new ZodPipe(intIdQuerySchema)) q: { id: number }) {
    return ok(await this.stories.remove(me.id, q.id));
  }

  @Post('add-story-view')
  async view(@CurrentUser() me: AuthUser, @Query(new ZodPipe(storyViewQuerySchema)) q: z.infer<typeof storyViewQuerySchema>) {
    return ok(await this.stories.addView(me.id, q.StoryId));
  }
}

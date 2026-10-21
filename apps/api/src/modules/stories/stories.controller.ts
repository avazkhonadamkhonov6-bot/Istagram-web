import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import {
  addHighlightSchema,
  addStoryQuerySchema,
  highlightsQuerySchema,
  intIdQuerySchema,
  replyStorySchema,
  storyIdQuerySchema,
  storyViewQuerySchema,
  updateHighlightSchema,
} from '@repo/shared';
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
    return ok(await this.stories.add(me.id, file, q.PostId, q.CloseFriends));
  }

  @Delete('DeleteStory')
  async remove(@CurrentUser() me: AuthUser, @Query(new ZodPipe(intIdQuerySchema)) q: { id: number }) {
    return ok(await this.stories.remove(me.id, q.id));
  }

  @Post('add-story-view')
  async view(@CurrentUser() me: AuthUser, @Query(new ZodPipe(storyViewQuerySchema)) q: z.infer<typeof storyViewQuerySchema>) {
    return ok(await this.stories.addView(me.id, q.StoryId));
  }

  /** Spec 14 §3 */
  @Get('get-story-viewers')
  async viewers(@CurrentUser() me: AuthUser, @Query(new ZodPipe(storyIdQuerySchema)) q: z.infer<typeof storyIdQuerySchema>) {
    return ok(await this.stories.viewers(me.id, q.storyId));
  }

  @Get('get-story-archive')
  async archive(@CurrentUser() me: AuthUser) {
    return ok(await this.stories.archive(me.id));
  }

  @Post('reply-story')
  async reply(@CurrentUser() me: AuthUser, @Body(new ZodPipe(replyStorySchema)) dto: z.infer<typeof replyStorySchema>) {
    return ok(await this.stories.replyToStory(me.id, dto.storyId, dto.text));
  }
}

/** Spec 14 §3 */
@ApiTags('Highlight')
@Controller('Highlight')
export class HighlightController {
  constructor(private readonly stories: StoriesService) {}

  @Get('get-highlights')
  async list(@CurrentUser() me: AuthUser, @Query(new ZodPipe(highlightsQuerySchema)) q: z.infer<typeof highlightsQuerySchema>) {
    return ok(await this.stories.highlights(me.id, q.UserId));
  }

  @Get('get-highlight-stories')
  async stories_(@CurrentUser() me: AuthUser, @Query(new ZodPipe(intIdQuerySchema)) q: { id: number }) {
    return ok(await this.stories.highlightStories(me.id, q.id));
  }

  @Post('add-highlight')
  async add(@CurrentUser() me: AuthUser, @Body(new ZodPipe(addHighlightSchema)) dto: z.infer<typeof addHighlightSchema>) {
    return ok(await this.stories.addHighlight(me.id, dto.title, dto.storyIds));
  }

  @Put('update-highlight')
  async update(@CurrentUser() me: AuthUser, @Body(new ZodPipe(updateHighlightSchema)) dto: z.infer<typeof updateHighlightSchema>) {
    return ok(await this.stories.updateHighlight(me.id, dto.id, dto.title, dto.storyIds));
  }

  @Delete('delete-highlight')
  async remove(@CurrentUser() me: AuthUser, @Query(new ZodPipe(intIdQuerySchema)) q: { id: number }) {
    return ok(await this.stories.deleteHighlight(me.id, q.id));
  }
}

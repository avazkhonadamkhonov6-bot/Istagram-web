import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AddLiveCommentDto, StartLiveDto, addLiveCommentSchema, liveIdQuerySchema, startLiveSchema } from '@repo/shared';
import type { z } from 'zod';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodPipe } from '../../common/pipes/zod.pipe';
import { ok } from '../../common/response';
import { LiveService } from './live.service';

type LiveIdQuery = z.infer<typeof liveIdQuerySchema>;

/** Spec 16 §3: efiri mustaqim */
@ApiTags('Live')
@Controller('Live')
export class LiveController {
  constructor(private readonly live: LiveService) {}

  @Post('start-live')
  async start(@CurrentUser() me: AuthUser, @Body(new ZodPipe(startLiveSchema)) dto: StartLiveDto) {
    return ok(await this.live.start(me.id, dto));
  }

  @Post('end-live')
  async end(@CurrentUser() me: AuthUser, @Query(new ZodPipe(liveIdQuerySchema)) q: LiveIdQuery) {
    return ok(await this.live.end(me.id, q.liveId));
  }

  @Get('get-lives')
  async active(@CurrentUser() me: AuthUser) {
    return ok(await this.live.active(me.id));
  }

  @Get('get-live-by-id')
  async getById(@CurrentUser() me: AuthUser, @Query(new ZodPipe(liveIdQuerySchema)) q: LiveIdQuery) {
    return ok(await this.live.getById(me.id, q.liveId));
  }

  @Get('get-comments')
  async comments(@CurrentUser() me: AuthUser, @Query(new ZodPipe(liveIdQuerySchema)) q: LiveIdQuery) {
    return ok(await this.live.comments(me.id, q.liveId));
  }

  @Post('add-comment')
  async addComment(@CurrentUser() me: AuthUser, @Body(new ZodPipe(addLiveCommentSchema)) dto: AddLiveCommentDto) {
    return ok(await this.live.addComment(me.id, dto.liveId, dto.text));
  }
}

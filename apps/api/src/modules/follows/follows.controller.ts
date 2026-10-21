import { Controller, Delete, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { followListQuerySchema, followQuerySchema } from '@repo/shared';
import type { z } from 'zod';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodPipe } from '../../common/pipes/zod.pipe';
import { ok } from '../../common/response';
import { FollowsService } from './follows.service';

type FollowQuery = z.infer<typeof followQuerySchema>;
type ListQuery = z.infer<typeof followListQuerySchema>;

@ApiTags('FollowingRelationShip')
@Controller('FollowingRelationShip')
export class FollowsController {
  constructor(private readonly follows: FollowsService) {}

  @Get('get-subscribers')
  async subscribers(@Query(new ZodPipe(followListQuerySchema)) q: ListQuery) {
    return ok(await this.follows.subscribers(q.UserId));
  }

  @Get('get-subscriptions')
  async subscriptions(@Query(new ZodPipe(followListQuerySchema)) q: ListQuery) {
    return ok(await this.follows.subscriptions(q.UserId));
  }

  @Post('add-following-relation-ship')
  async follow(@CurrentUser() me: AuthUser, @Query(new ZodPipe(followQuerySchema)) q: FollowQuery) {
    return ok(await this.follows.follow(me.id, q.followingUserId));
  }

  @Delete('delete-following-relation-ship')
  async unfollow(@CurrentUser() me: AuthUser, @Query(new ZodPipe(followQuerySchema)) q: FollowQuery) {
    return ok(await this.follows.unfollow(me.id, q.followingUserId));
  }
}

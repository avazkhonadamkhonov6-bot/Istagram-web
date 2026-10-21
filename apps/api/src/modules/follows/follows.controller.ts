import { Controller, Delete, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { followListQuerySchema, followQuerySchema, userIdQuerySchema } from '@repo/shared';
import type { z } from 'zod';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodPipe } from '../../common/pipes/zod.pipe';
import { ok } from '../../common/response';
import { FollowsService } from './follows.service';

type FollowQuery = z.infer<typeof followQuerySchema>;
type ListQuery = z.infer<typeof followListQuerySchema>;
type UserIdQuery = z.infer<typeof userIdQuerySchema>;

@ApiTags('FollowingRelationShip')
@Controller('FollowingRelationShip')
export class FollowsController {
  constructor(private readonly follows: FollowsService) {}

  @Get('get-subscribers')
  async subscribers(@CurrentUser() me: AuthUser, @Query(new ZodPipe(followListQuerySchema)) q: ListQuery) {
    return ok(await this.follows.subscribers(me.id, q.UserId));
  }

  @Get('get-subscriptions')
  async subscriptions(@CurrentUser() me: AuthUser, @Query(new ZodPipe(followListQuerySchema)) q: ListQuery) {
    return ok(await this.follows.subscriptions(me.id, q.UserId));
  }

  @Post('add-following-relation-ship')
  async follow(@CurrentUser() me: AuthUser, @Query(new ZodPipe(followQuerySchema)) q: FollowQuery) {
    return ok(await this.follows.follow(me.id, q.followingUserId));
  }

  @Delete('delete-following-relation-ship')
  async unfollow(@CurrentUser() me: AuthUser, @Query(new ZodPipe(followQuerySchema)) q: FollowQuery) {
    return ok(await this.follows.unfollow(me.id, q.followingUserId));
  }

  /** Spec 14 §1.1 */
  @Get('get-follow-requests')
  async requests(@CurrentUser() me: AuthUser) {
    return ok(await this.follows.requests(me.id));
  }

  @Post('accept-follow-request')
  async accept(@CurrentUser() me: AuthUser, @Query(new ZodPipe(userIdQuerySchema)) q: UserIdQuery) {
    return ok(await this.follows.accept(me.id, q.userId));
  }

  @Delete('decline-follow-request')
  async decline(@CurrentUser() me: AuthUser, @Query(new ZodPipe(userIdQuerySchema)) q: UserIdQuery) {
    return ok(await this.follows.decline(me.id, q.userId));
  }
}

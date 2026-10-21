import { Body, Controller, Delete, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AddReportDto, addReportSchema, muteQuerySchema, userIdQuerySchema } from '@repo/shared';
import type { z } from 'zod';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodPipe } from '../../common/pipes/zod.pipe';
import { ok } from '../../common/response';
import { RelationsService } from './relations.service';

type UserIdQuery = z.infer<typeof userIdQuerySchema>;

/** Spec 14 §1.2–1.4, 1.6 — dar hamon prefiks-i `/User` */
@ApiTags('User')
@Controller('User')
export class RelationsController {
  constructor(private readonly relations: RelationsService) {}

  @Post('block-user')
  async block(@CurrentUser() me: AuthUser, @Query(new ZodPipe(userIdQuerySchema)) q: UserIdQuery) {
    return ok(await this.relations.block(me.id, q.userId));
  }

  @Delete('unblock-user')
  async unblock(@CurrentUser() me: AuthUser, @Query(new ZodPipe(userIdQuerySchema)) q: UserIdQuery) {
    return ok(await this.relations.unset(me.id, q.userId, ['BLOCK']));
  }

  @Get('get-blocked-users')
  async blocked(@CurrentUser() me: AuthUser) {
    return ok(await this.relations.list(me.id, 'BLOCK'));
  }

  @Post('mute-user')
  async mute(@CurrentUser() me: AuthUser, @Query(new ZodPipe(muteQuerySchema)) q: z.infer<typeof muteQuerySchema>) {
    return ok(await this.relations.mute(me.id, q.userId, q.Posts, q.Stories));
  }

  @Delete('unmute-user')
  async unmute(@CurrentUser() me: AuthUser, @Query(new ZodPipe(userIdQuerySchema)) q: UserIdQuery) {
    return ok(await this.relations.unset(me.id, q.userId, ['MUTE_POSTS', 'MUTE_STORIES']));
  }

  @Get('get-muted-users')
  async muted(@CurrentUser() me: AuthUser) {
    const [posts, stories] = await Promise.all([this.relations.list(me.id, 'MUTE_POSTS'), this.relations.list(me.id, 'MUTE_STORIES')]);
    const byId = new Map([...posts, ...stories].map((u) => [u.id, u]));
    return ok([...byId.values()]);
  }

  @Post('restrict-user')
  async restrict(@CurrentUser() me: AuthUser, @Query(new ZodPipe(userIdQuerySchema)) q: UserIdQuery) {
    return ok(await this.relations.set(me.id, q.userId, 'RESTRICT'));
  }

  @Delete('unrestrict-user')
  async unrestrict(@CurrentUser() me: AuthUser, @Query(new ZodPipe(userIdQuerySchema)) q: UserIdQuery) {
    return ok(await this.relations.unset(me.id, q.userId, ['RESTRICT']));
  }

  @Get('get-restricted-users')
  async restricted(@CurrentUser() me: AuthUser) {
    return ok(await this.relations.list(me.id, 'RESTRICT'));
  }

  @Post('add-close-friend')
  async addCloseFriend(@CurrentUser() me: AuthUser, @Query(new ZodPipe(userIdQuerySchema)) q: UserIdQuery) {
    return ok(await this.relations.set(me.id, q.userId, 'CLOSE_FRIEND'));
  }

  @Delete('remove-close-friend')
  async removeCloseFriend(@CurrentUser() me: AuthUser, @Query(new ZodPipe(userIdQuerySchema)) q: UserIdQuery) {
    return ok(await this.relations.unset(me.id, q.userId, ['CLOSE_FRIEND']));
  }

  @Get('get-close-friends')
  async closeFriends(@CurrentUser() me: AuthUser) {
    return ok(await this.relations.list(me.id, 'CLOSE_FRIEND'));
  }

  /** Holati man nisbat ba user (menyui profil) */
  @Get('get-relation-status')
  async status(@CurrentUser() me: AuthUser, @Query(new ZodPipe(userIdQuerySchema)) q: UserIdQuery) {
    return ok(await this.relations.status(me.id, q.userId));
  }
}

/** Spec 14 §1.5 */
@ApiTags('Report')
@Controller('Report')
export class ReportController {
  constructor(private readonly relations: RelationsService) {}

  @Post('add-report')
  async add(@CurrentUser() me: AuthUser, @Body(new ZodPipe(addReportSchema)) dto: AddReportDto) {
    return ok(await this.relations.report(me.id, dto));
  }
}

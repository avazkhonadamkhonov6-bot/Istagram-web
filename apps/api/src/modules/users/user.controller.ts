import { Controller, Delete, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  addSearchHistoryQuerySchema,
  addUserSearchHistoryQuerySchema,
  deleteUserQuerySchema,
  getUsersQuerySchema,
  intIdQuerySchema,
  suggestionsQuerySchema,
} from '@repo/shared';
import type { z } from 'zod';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodPipe } from '../../common/pipes/zod.pipe';
import { ok, paged } from '../../common/response';
import { UsersService } from './users.service';

@ApiTags('User')
@Controller('User')
export class UserController {
  constructor(private readonly users: UsersService) {}

  @Get('get-users')
  async getUsers(@Query(new ZodPipe(getUsersQuerySchema)) q: z.infer<typeof getUsersQuerySchema>) {
    const { items, total } = await this.users.getUsers(q);
    return paged(items, total, q);
  }

  @Get('get-suggestions')
  async suggestions(@CurrentUser() me: AuthUser, @Query(new ZodPipe(suggestionsQuerySchema)) q: z.infer<typeof suggestionsQuerySchema>) {
    return ok(await this.users.getSuggestions(me.id, q.Limit));
  }

  @Post('add-search-history')
  async addSearchHistory(
    @CurrentUser() me: AuthUser,
    @Query(new ZodPipe(addSearchHistoryQuerySchema)) q: z.infer<typeof addSearchHistoryQuerySchema>,
  ) {
    return ok(await this.users.addSearchHistory(me.id, q.Text));
  }

  @Get('get-search-histories')
  async getSearchHistories(@CurrentUser() me: AuthUser) {
    return ok(await this.users.getSearchHistories(me.id));
  }

  @Delete('delete-search-history')
  async deleteSearchHistory(@CurrentUser() me: AuthUser, @Query(new ZodPipe(intIdQuerySchema)) q: { id: number }) {
    return ok(await this.users.deleteSearchHistory(me.id, q.id));
  }

  @Delete('delete-search-histories')
  async deleteSearchHistories(@CurrentUser() me: AuthUser) {
    return ok(await this.users.deleteSearchHistory(me.id));
  }

  @Post('add-user-search-history')
  async addUserSearchHistory(
    @CurrentUser() me: AuthUser,
    @Query(new ZodPipe(addUserSearchHistoryQuerySchema)) q: z.infer<typeof addUserSearchHistoryQuerySchema>,
  ) {
    return ok(await this.users.addUserSearchHistory(me.id, q.UserSearchId));
  }

  @Get('get-user-search-histories')
  async getUserSearchHistories(@CurrentUser() me: AuthUser) {
    return ok(await this.users.getUserSearchHistories(me.id));
  }

  @Delete('delete-user-search-history')
  async deleteUserSearchHistory(@CurrentUser() me: AuthUser, @Query(new ZodPipe(intIdQuerySchema)) q: { id: number }) {
    return ok(await this.users.deleteUserSearchHistory(me.id, q.id));
  }

  @Delete('delete-user-search-histories')
  async deleteUserSearchHistories(@CurrentUser() me: AuthUser) {
    return ok(await this.users.deleteUserSearchHistory(me.id));
  }

  @Delete('delete-user')
  async deleteUser(@CurrentUser() me: AuthUser, @Query(new ZodPipe(deleteUserQuerySchema)) q: z.infer<typeof deleteUserQuerySchema>) {
    return ok(await this.users.deleteUser(me.id, q.userId));
  }
}

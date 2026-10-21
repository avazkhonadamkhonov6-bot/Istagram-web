import { Controller, Get, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { paginationQuerySchema } from '@repo/shared';
import type { z } from 'zod';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodPipe } from '../../common/pipes/zod.pipe';
import { ok, paged } from '../../common/response';
import { NotificationsService } from './notifications.service';

@ApiTags('Notification')
@Controller('Notification')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get('get-notifications')
  async list(@CurrentUser() me: AuthUser, @Query(new ZodPipe(paginationQuerySchema)) q: z.infer<typeof paginationQuerySchema>) {
    const { items, total } = await this.notifications.list(me.id, q);
    return paged(items, total, q);
  }

  @Get('get-unread-count')
  async unreadCount(@CurrentUser() me: AuthUser) {
    return ok(await this.notifications.unreadCount(me.id));
  }

  @Put('read-all')
  async readAll(@CurrentUser() me: AuthUser) {
    return ok(await this.notifications.readAll(me.id));
  }
}

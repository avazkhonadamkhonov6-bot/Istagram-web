import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { StartCallDto, callIdQuerySchema, paginationQuerySchema, startCallSchema } from '@repo/shared';
import type { z } from 'zod';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodPipe } from '../../common/pipes/zod.pipe';
import { ok } from '../../common/response';
import { CallsService } from './calls.service';

type CallIdQuery = z.infer<typeof callIdQuerySchema>;

/** Spec 16 §2: zangi audio / video dar Direct */
@ApiTags('Call')
@Controller('Call')
export class CallsController {
  constructor(private readonly calls: CallsService) {}

  @Get('get-ice-servers')
  iceServers() {
    return ok(this.calls.iceServers());
  }

  @Post('start-call')
  async start(@CurrentUser() me: AuthUser, @Body(new ZodPipe(startCallSchema)) dto: StartCallDto) {
    return ok(await this.calls.start(me.id, dto));
  }

  @Post('accept-call')
  async accept(@CurrentUser() me: AuthUser, @Query(new ZodPipe(callIdQuerySchema)) q: CallIdQuery) {
    return ok(await this.calls.accept(me.id, q.callId));
  }

  @Post('decline-call')
  async decline(@CurrentUser() me: AuthUser, @Query(new ZodPipe(callIdQuerySchema)) q: CallIdQuery) {
    return ok(await this.calls.decline(me.id, q.callId));
  }

  @Post('end-call')
  async end(@CurrentUser() me: AuthUser, @Query(new ZodPipe(callIdQuerySchema)) q: CallIdQuery) {
    return ok(await this.calls.leave(me.id, q.callId));
  }

  @Get('get-call-by-id')
  async getById(@CurrentUser() me: AuthUser, @Query(new ZodPipe(callIdQuerySchema)) q: CallIdQuery) {
    return ok(await this.calls.getById(me.id, q.callId));
  }

  @Get('get-active-calls')
  async active(@CurrentUser() me: AuthUser) {
    return ok(await this.calls.active(me.id));
  }

  @Get('get-calls')
  async history(@CurrentUser() me: AuthUser, @Query(new ZodPipe(paginationQuerySchema)) q: z.infer<typeof paginationQuerySchema>) {
    return this.calls.history(me.id, q);
  }
}

import { Body, Controller, Delete, HttpCode, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  LoginDto,
  RegisterDto,
  changePasswordQuerySchema,
  forgotPasswordQuerySchema,
  loginSchema,
  registerSchema,
  resetPasswordQuerySchema,
} from '@repo/shared';
import type { z } from 'zod';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ZodPipe } from '../../common/pipes/zod.pipe';
import { ok } from '../../common/response';
import { AccountService } from './account.service';

const MINUTE = 60_000;

@ApiTags('Account')
@Controller('Account')
export class AccountController {
  constructor(private readonly account: AccountService) {}

  @Public()
  @Throttle({ default: { limit: 3, ttl: MINUTE } })
  @Post('register')
  @HttpCode(200)
  async register(@Body(new ZodPipe(registerSchema)) dto: RegisterDto) {
    return ok(await this.account.register(dto));
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: MINUTE } })
  @Post('login')
  @HttpCode(200)
  async login(@Body(new ZodPipe(loginSchema)) dto: LoginDto) {
    return ok(await this.account.login(dto));
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: MINUTE } })
  @Delete('ForgotPassword')
  async forgotPassword(@Query(new ZodPipe(forgotPasswordQuerySchema)) q: z.infer<typeof forgotPasswordQuerySchema>) {
    return ok(await this.account.forgotPassword(q.Email));
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: MINUTE } })
  @Delete('ResetPassword')
  async resetPassword(@Query(new ZodPipe(resetPasswordQuerySchema)) q: z.infer<typeof resetPasswordQuerySchema>) {
    return ok(await this.account.resetPassword(q.Email, q.Token, q.Password));
  }

  @Put('ChangePassword')
  async changePassword(
    @CurrentUser() me: AuthUser,
    @Query(new ZodPipe(changePasswordQuerySchema)) q: z.infer<typeof changePasswordQuerySchema>,
  ) {
    return ok(await this.account.changePassword(me.id, q.OldPassword, q.Password));
  }
}

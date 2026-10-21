import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ErrorCode } from '@repo/shared';
import type { Request } from 'express';
import { AppException } from '../app-exception';
import { AuthUser } from '../decorators/current-user.decorator';
import { IS_PUBLIC } from '../decorators/public.decorator';

export interface JwtPayload {
  sub: string;
  name: string;
}

/** Guard-i global: hamai endpoint-ho token talab mekunand, gayr az @Public(). */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [ctx.getHandler(), ctx.getClass()]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const [type, token] = req.headers.authorization?.split(' ') ?? [];
    if (type !== 'Bearer' || !token) throw new AppException(HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED);

    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);
      req.user = { id: payload.sub, userName: payload.name };
      return true;
    } catch {
      throw new AppException(HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED);
    }
  }
}

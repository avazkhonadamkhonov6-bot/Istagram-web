import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { Response } from 'express';

/** Kontrakt (Spec 12): javobi muvaffaq hamesha 200, hatto baroi POST */
@Injectable()
export class StatusOkInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler) {
    if (ctx.getType() === 'http') ctx.switchToHttp().getResponse<Response>().status(200);
    return next.handle();
  }
}

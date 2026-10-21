import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { ErrorCode, ErrorMessage } from '@repo/shared';
import type { Request, Response } from 'express';
import { AppException } from '../app-exception';

/** Har xato → { data: null, errors, statusCode, code }. Server hech vaqt namemirad. */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code: ErrorCode = ErrorCode.INTERNAL_ERROR;
    let errors: string[] = [ErrorMessage.INTERNAL_ERROR];

    if (exception instanceof AppException) {
      status = exception.getStatus();
      code = exception.code;
      errors = [exception.message, ...exception.details];
    } else if (exception instanceof ThrottlerException) {
      status = HttpStatus.TOO_MANY_REQUESTS;
      code = ErrorCode.TOO_MANY_REQUESTS;
      errors = [ErrorMessage.TOO_MANY_REQUESTS];
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      code = status === 401 ? ErrorCode.UNAUTHORIZED : status === 404 ? ErrorCode.NOT_FOUND : status === 403 ? ErrorCode.FORBIDDEN : ErrorCode.VALIDATION_ERROR;
      const body = exception.getResponse();
      const msg = typeof body === 'string' ? body : (body as { message?: string | string[] }).message;
      errors = Array.isArray(msg) ? msg : [msg ?? exception.message];
    } else {
      this.logger.error({ err: exception, path: req.url }, 'Xatoi nomatlub');
    }

    if (!res.headersSent) {
      res.status(status).json({ data: null, errors, statusCode: status, code });
    }
  }
}

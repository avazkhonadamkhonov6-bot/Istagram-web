import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode, ErrorMessage } from '@repo/shared';

/** Xatoi domen bo `code` az packages/shared/error-codes.ts */
export class AppException extends HttpException {
  constructor(
    status: HttpStatus,
    readonly code: ErrorCode,
    message: string = ErrorMessage[code],
    readonly details: string[] = [],
  ) {
    super(message, status);
  }
}

export const notFound = (code: ErrorCode) => new AppException(HttpStatus.NOT_FOUND, code);
export const forbidden = (code: ErrorCode = ErrorCode.NOT_OWNER) => new AppException(HttpStatus.FORBIDDEN, code);
export const badRequest = (code: ErrorCode) => new AppException(HttpStatus.BAD_REQUEST, code);
export const conflict = (code: ErrorCode) => new AppException(HttpStatus.CONFLICT, code);

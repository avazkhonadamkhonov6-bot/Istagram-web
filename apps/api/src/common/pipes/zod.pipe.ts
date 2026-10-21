import { HttpStatus, PipeTransform } from '@nestjs/common';
import { ErrorCode, ErrorMessage } from '@repo/shared';
import type { ZodTypeAny, z } from 'zod';
import { AppException } from '../app-exception';

/** Validatsiyai body/query bo schema-i Zod az packages/shared. */
export class ZodPipe<S extends ZodTypeAny> implements PipeTransform<unknown, z.infer<S>> {
  constructor(private readonly schema: S) {}

  transform(value: unknown): z.infer<S> {
    const parsed = this.schema.safeParse(value ?? {});
    if (parsed.success) return parsed.data;
    const details = parsed.error.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`);
    // Xatoi parolhoi nomos — kodi alohida
    const mismatch = parsed.error.issues.some((i) => i.message === 'Parolho mos nestand');
    const code = mismatch ? ErrorCode.PASSWORDS_DO_NOT_MATCH : ErrorCode.VALIDATION_ERROR;
    throw new AppException(HttpStatus.BAD_REQUEST, code, ErrorMessage[code], details);
  }
}

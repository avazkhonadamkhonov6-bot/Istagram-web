import { z } from 'zod';

/** Javobi yagona: { data, errors, statusCode } */
export const responseSchema = <T extends z.ZodTypeAny>(data: T) =>
  z.object({
    data: data.nullable(),
    errors: z.array(z.string()),
    statusCode: z.number().int(),
  });

/** Javobi sahifador */
export const pagedResponseSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    pageNumber: z.number().int(),
    pageSize: z.number().int(),
    totalPage: z.number().int(),
    totalRecord: z.number().int(),
    data: z.array(item),
    errors: z.array(z.string()),
    statusCode: z.number().int(),
  });

export type ApiResponse<T> = { data: T | null; errors: string[]; statusCode: number };
export type PagedResponse<T> = {
  pageNumber: number;
  pageSize: number;
  totalPage: number;
  totalRecord: number;
  data: T[];
  errors: string[];
  statusCode: number;
};

const intFromQuery = z.coerce.number().int();

export const paginationQuerySchema = z.object({
  PageNumber: intFromQuery.min(1).default(1),
  PageSize: intFromQuery.min(1).max(50).default(10),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export const intIdQuerySchema = z.object({ id: intFromQuery.positive() });
export const userIdSchema = z.string().uuid();

export const userShortSchema = z.object({
  id: z.string(),
  userName: z.string(),
  fullName: z.string().nullable(),
  avatar: z.string().nullable(),
});
export type UserShort = z.infer<typeof userShortSchema>;

/** Qoidahoi fayl (Spec 12 §1) */
export const MEDIA_RULES = {
  imageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  videoTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
  /** Paymi ovozi dar Direct (Spec 14 §4) */
  audioTypes: ['audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp4'],
  maxImageBytes: 10 * 1024 * 1024,
  maxAudioBytes: 10 * 1024 * 1024,
  maxVideoBytes: 100 * 1024 * 1024,
  maxPostFiles: 10,
} as const;

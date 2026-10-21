import type { ApiResponse, PagedResponse, PaginationQuery } from '@repo/shared';

/** Javobi yagona (Spec 12 §1) */
export function ok<T>(data: T, statusCode = 200): ApiResponse<T> {
  return { data, errors: [], statusCode };
}

export function paged<T>(data: T[], totalRecord: number, q: PaginationQuery): PagedResponse<T> {
  return {
    pageNumber: q.PageNumber,
    pageSize: q.PageSize,
    totalPage: Math.ceil(totalRecord / q.PageSize),
    totalRecord,
    data,
    errors: [],
    statusCode: 200,
  };
}

export const skipTake = (q: PaginationQuery) => ({ skip: (q.PageNumber - 1) * q.PageSize, take: q.PageSize });

import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC = 'isPublic';
/** Endpoint bidun token */
export const Public = () => SetMetadata(IS_PUBLIC, true);

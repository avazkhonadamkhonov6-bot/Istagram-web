import { MEDIA_RULES } from '@repo/shared';

/** Limit-i multer: andozai maks. = video; tekshirishi daqiq — dar StorageService. */
export const uploadLimits = { fileSize: MEDIA_RULES.maxVideoBytes, files: MEDIA_RULES.maxPostFiles } as const;

import { z } from 'zod';

/**
 * Instants (Spec 17): aksi momentali az kamera, be tahrir, baroi dustoni mutual yo close friends.
 * Giranda yak bor mebinad, ba'd nopadid meshavad; 24 soat zinda ast, dar archive-i muallif 1 sol memonad.
 */
export const INSTANT_TTL_MS = 24 * 3600_000;
export const INSTANT_ARCHIVE_MS = 365 * 24 * 3600_000;

export const addInstantQuerySchema = z.object({
  CloseFriends: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),
});

export const instantIdQuerySchema = z.object({ id: z.coerce.number().int().positive() });

export const instantDtoSchema = z.object({
  id: z.number().int(),
  userId: z.string(),
  userName: z.string(),
  userImage: z.string().nullable(),
  fileName: z.string(),
  closeFriends: z.boolean(),
  createdAt: z.string(),
  expiresAt: z.string(),
  /** Shumorai binandagon — faqat baroi muallif, baroi digaron null */
  viewCount: z.number().int().nullable(),
});
export type InstantDto = z.infer<typeof instantDtoSchema>;

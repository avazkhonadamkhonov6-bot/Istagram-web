import { z } from 'zod';
import { userShortSchema } from './common';
import { rtcSignalSchema } from './call';

/**
 * Efiri mustaqim (Spec 16 §3). Video az brauzeri muallif ba har tamoshobin bevosita (WebRTC),
 * server — signaling, tamoshobinho, comment-ho va dil-ho.
 */
/** WebRTC mesh: har tamoshobin — yak connection-i muallif */
export const LIVE_MAX_VIEWERS = 50;

export const startLiveSchema = z.object({ title: z.string().trim().max(100).optional() }).strict();
export type StartLiveDto = z.infer<typeof startLiveSchema>;
export const liveIdQuerySchema = z.object({ liveId: z.coerce.number().int().positive() });
export const addLiveCommentSchema = z.object({ liveId: z.number().int().positive(), text: z.string().trim().min(1).max(150) }).strict();
export type AddLiveCommentDto = z.infer<typeof addLiveCommentSchema>;

/** client → server: `live:join`, `live:leave`, `live:heart` */
export const liveRoomSchema = z.object({ liveId: z.number().int().positive() });
/** client → server: `live:signal` (muallif ↔ tamoshobin) */
export const liveSignalSchema = z.object({ liveId: z.number().int().positive(), toUserId: z.string().uuid(), signal: rtcSignalSchema });
export type LiveSignalPayload = z.infer<typeof liveSignalSchema>;

export const liveDtoSchema = z.object({
  liveId: z.number().int(),
  user: userShortSchema,
  title: z.string().nullable(),
  status: z.enum(['LIVE', 'ENDED']),
  startedAt: z.string(),
  endedAt: z.string().nullable(),
  viewerCount: z.number().int(),
  peakViewers: z.number().int(),
});
export type LiveDto = z.infer<typeof liveDtoSchema>;

export const liveCommentDtoSchema = z.object({
  id: z.number().int(),
  liveId: z.number().int(),
  user: userShortSchema,
  text: z.string(),
  createdAt: z.string(),
});
export type LiveCommentDto = z.infer<typeof liveCommentDtoSchema>;

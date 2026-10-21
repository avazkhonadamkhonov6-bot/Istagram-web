import { z } from 'zod';
import { userShortSchema } from './common';

/**
 * Zangi audio / video dar Direct (Spec 16 §2).
 * Server faqat signaling mekunad (Socket.IO), audio/video bevosita bayni brauzerho meravad (WebRTC).
 */
export const CALL_TYPES = ['AUDIO', 'VIDEO'] as const;
export const CALL_STATUSES = ['RINGING', 'ONGOING', 'ENDED', 'MISSED', 'DECLINED'] as const;
/** Agar dar 45 s kase qabul nakunad → MISSED */
export const CALL_RING_TIMEOUT_MS = 45_000;

export const startCallSchema = z.object({ chatId: z.number().int().positive(), type: z.enum(CALL_TYPES) }).strict();
export type StartCallDto = z.infer<typeof startCallSchema>;
export const callIdQuerySchema = z.object({ callId: z.coerce.number().int().positive() });

/** Payomi WebRTC: offer / answer (sdp) yo ICE candidate */
export const rtcSignalSchema = z.object({
  type: z.enum(['offer', 'answer', 'candidate']),
  sdp: z.string().max(20_000).optional(),
  candidate: z
    .object({
      candidate: z.string().max(1000),
      sdpMid: z.string().max(100).nullable().optional(),
      sdpMLineIndex: z.number().int().nullable().optional(),
      usernameFragment: z.string().max(100).nullable().optional(),
    })
    .optional(),
});
export type RtcSignal = z.infer<typeof rtcSignalSchema>;

/** client → server: `call:signal` */
export const callSignalSchema = z.object({ callId: z.number().int().positive(), toUserId: z.string().uuid(), signal: rtcSignalSchema });
export type CallSignalPayload = z.infer<typeof callSignalSchema>;

export const callParticipantSchema = userShortSchema.extend({
  joinedAt: z.string().nullable(),
  leftAt: z.string().nullable(),
});

export const callDtoSchema = z.object({
  callId: z.number().int(),
  chatId: z.number().int(),
  type: z.enum(CALL_TYPES),
  status: z.enum(CALL_STATUSES),
  caller: userShortSchema,
  participants: z.array(callParticipantSchema),
  isGroup: z.boolean(),
  /** Unvoni chat-i group yo null */
  title: z.string().nullable(),
  createdAt: z.string(),
  answeredAt: z.string().nullable(),
  endedAt: z.string().nullable(),
  /** Az answeredAt to endedAt (soniya); agar qabul nashuda — 0 */
  durationSec: z.number().int(),
});
export type CallDto = z.infer<typeof callDtoSchema>;

/** `GET /Call/get-ice-servers` — baroi `new RTCPeerConnection({ iceServers })` */
export const iceServerSchema = z.object({
  urls: z.union([z.string(), z.array(z.string())]),
  username: z.string().optional(),
  credential: z.string().optional(),
});
export type IceServer = z.infer<typeof iceServerSchema>;

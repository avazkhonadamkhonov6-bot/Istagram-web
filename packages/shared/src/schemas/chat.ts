import { z } from 'zod';
import { userShortSchema } from './common';

export const createChatQuerySchema = z.object({ receiverUserId: z.string().uuid() });
export const chatIdQuerySchema = z.object({ chatId: z.coerce.number().int().positive() });
export const deleteMessageQuerySchema = z.object({ massageId: z.coerce.number().int().positive() });

/** Maydonhoi matnii multipart-i send-message (fayl — `File`) */
export const sendMessageBodySchema = z.object({
  ChatId: z.coerce.number().int().positive(),
  MessageText: z.string().trim().max(1000).optional(),
  /** Share post ba Direct (Spec 13 §4) */
  SharedPostId: z.coerce.number().int().positive().optional(),
  /** Spec 14 §3–4 */
  SharedStoryId: z.coerce.number().int().positive().optional(),
  ReplyToMessageId: z.coerce.number().int().positive().optional(),
  /** Spec 16 §1: davomnokii paymi ovozi / video (soniya), baroi namoish dar UI */
  Duration: z.coerce.number().int().min(0).max(3600).optional(),
});

/** Group chat (Spec 14 §4) */
export const createGroupSchema = z
  .object({ title: z.string().trim().min(1).max(50), userIds: z.array(z.string().uuid()).min(2).max(31) })
  .strict();
export const updateGroupSchema = z.object({ chatId: z.number().int().positive(), title: z.string().trim().min(1).max(50) }).strict();
export const addGroupMembersSchema = z
  .object({ chatId: z.number().int().positive(), userIds: z.array(z.string().uuid()).min(1).max(30) })
  .strict();
/** Spec 15 §3: tahriri paym (faqat matn, to 15 daqiqa) */
export const MESSAGE_EDIT_WINDOW_MS = 15 * 60_000;
export const editMessageSchema = z.object({ messageId: z.number().int().positive(), text: z.string().trim().min(1).max(1000) }).strict();
export type EditMessageDto = z.infer<typeof editMessageSchema>;
export const messageIdQuerySchema = z.object({ messageId: z.coerce.number().int().positive() });
export const FILE_TYPES = ['image', 'video', 'audio'] as const;

export const messageDtoSchema = z.object({
  messageId: z.number().int(),
  chatId: z.number().int(),
  userId: z.string(),
  userName: z.string(),
  userImage: z.string().nullable(),
  messageText: z.string().nullable(),
  file: z.string().nullable(),
  sendMassageDate: z.string(),
  sharedPost: z.object({ postId: z.number().int(), image: z.string().nullable(), userName: z.string() }).nullable(),
  /** Spec 14 §3–4 */
  fileType: z.enum(FILE_TYPES).nullable().default(null),
  likes: z.array(z.string()).default([]),
  replyTo: z.object({ messageId: z.number().int(), userName: z.string(), text: z.string().nullable() }).nullable().default(null),
  story: z
    .object({ storyId: z.number().int(), fileName: z.string().nullable(), userName: z.string(), isExpired: z.boolean() })
    .nullable()
    .default(null),
  /** Spec 15 §3: vaqti tahrir */
  editedAt: z.string().nullable().default(null),
  /** Spec 16 §1: soniyaho (paymi ovozi / video) */
  durationSec: z.number().int().nullable().default(null),
  /** Spec 16 §2: paymi "zang" dar chat (Audio call · 3:12, Missed video call) */
  call: z
    .object({
      callId: z.number().int(),
      type: z.enum(['AUDIO', 'VIDEO']),
      status: z.enum(['RINGING', 'ONGOING', 'ENDED', 'MISSED', 'DECLINED']),
      durationSec: z.number().int(),
    })
    .nullable()
    .default(null),
});
export type MessageDto = z.infer<typeof messageDtoSchema>;

export const chatDtoSchema = z.object({
  chatId: z.number().int(),
  sendUserId: z.string(),
  sendUserName: z.string(),
  sendUserImage: z.string().nullable(),
  receiveUserId: z.string(),
  receiveUserName: z.string(),
  receiveUserImage: z.string().nullable(),
  lastMessage: messageDtoSchema.nullable(),
  /** Paymhoi tarafi digar, ki man hanuz naxondaam (Spec 13 §4) */
  unreadCount: z.number().int(),
  /** Tarafi digar to kay xond — baroi "Seen" */
  peerReadAt: z.string().nullable(),
  /** Group chat (Spec 14 §4) */
  isGroup: z.boolean().default(false),
  title: z.string().nullable().default(null),
  members: z.array(userShortSchema).default([]),
  /** Spec 15 §4: holati tarafi digar (faqat 1:1) */
  peerIsOnline: z.boolean().default(false),
  peerLastActiveAt: z.string().nullable().default(null),
});

export const chatReadSchema = z.object({ chatId: z.number().int(), readAt: z.string() });
export const typingSchema = z.object({ chatId: z.number().int().positive(), isTyping: z.boolean() });
export type TypingPayload = z.infer<typeof typingSchema>;
export type ChatDto = z.infer<typeof chatDtoSchema>;

/** Event-hoi Socket.IO (server -> client) */
export const SocketEvent = {
  MESSAGE_NEW: 'message:new',
  MESSAGE_DELETED: 'message:deleted',
  CHAT_READ: 'chat:read',
  TYPING: 'typing',
  NOTIFICATION_NEW: 'notification:new',
  /** Like-i paym (Spec 14 §4) */
  MESSAGE_UPDATED: 'message:updated',
  /** Spec 16 §2: zang (server → client: CallDto; `call:signal` — { callId, fromUserId, signal }) */
  CALL_INCOMING: 'call:incoming',
  CALL_ACCEPTED: 'call:accepted',
  CALL_DECLINED: 'call:declined',
  CALL_LEFT: 'call:left',
  CALL_ENDED: 'call:ended',
  CALL_SIGNAL: 'call:signal',
  /** Spec 16 §3: efir */
  LIVE_STARTED: 'live:started',
  LIVE_ENDED: 'live:ended',
  LIVE_VIEWER_JOINED: 'live:viewer-joined',
  LIVE_VIEWER_LEFT: 'live:viewer-left',
  LIVE_VIEWERS: 'live:viewers',
  LIVE_COMMENT: 'live:comment',
  LIVE_HEART: 'live:heart',
  LIVE_SIGNAL: 'live:signal',
} as const;

/** Event-hoi Socket.IO (client → server), Spec 16. Javob — ack `{ ok: true, data? }` yo `{ ok: false, code }` */
export const ClientEvent = {
  TYPING: 'typing',
  CALL_SIGNAL: 'call:signal',
  LIVE_JOIN: 'live:join',
  LIVE_LEAVE: 'live:leave',
  LIVE_SIGNAL: 'live:signal',
  LIVE_HEART: 'live:heart',
} as const;

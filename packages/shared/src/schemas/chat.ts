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
});

/** Group chat (Spec 14 §4) */
export const createGroupSchema = z
  .object({ title: z.string().trim().min(1).max(50), userIds: z.array(z.string().uuid()).min(2).max(31) })
  .strict();
export const updateGroupSchema = z.object({ chatId: z.number().int().positive(), title: z.string().trim().min(1).max(50) }).strict();
export const addGroupMembersSchema = z
  .object({ chatId: z.number().int().positive(), userIds: z.array(z.string().uuid()).min(1).max(30) })
  .strict();
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
} as const;

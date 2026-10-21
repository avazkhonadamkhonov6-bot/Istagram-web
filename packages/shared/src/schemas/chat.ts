import { z } from 'zod';

export const createChatQuerySchema = z.object({ receiverUserId: z.string().uuid() });
export const chatIdQuerySchema = z.object({ chatId: z.coerce.number().int().positive() });
export const deleteMessageQuerySchema = z.object({ massageId: z.coerce.number().int().positive() });

/** Maydonhoi matnii multipart-i send-message (fayl — `File`) */
export const sendMessageBodySchema = z.object({
  ChatId: z.coerce.number().int().positive(),
  MessageText: z.string().trim().max(1000).optional(),
  /** Share post ba Direct (Spec 13 §4) */
  SharedPostId: z.coerce.number().int().positive().optional(),
});

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
} as const;

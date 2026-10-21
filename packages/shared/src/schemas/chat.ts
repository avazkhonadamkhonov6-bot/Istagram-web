import { z } from 'zod';

export const createChatQuerySchema = z.object({ receiverUserId: z.string().uuid() });
export const chatIdQuerySchema = z.object({ chatId: z.coerce.number().int().positive() });
export const deleteMessageQuerySchema = z.object({ massageId: z.coerce.number().int().positive() });

/** Maydonhoi matnii multipart-i send-message (fayl — `File`) */
export const sendMessageBodySchema = z.object({
  ChatId: z.coerce.number().int().positive(),
  MessageText: z.string().trim().max(1000).optional(),
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
});
export type ChatDto = z.infer<typeof chatDtoSchema>;

/** Event-hoi Socket.IO (server -> client) */
export const SocketEvent = {
  MESSAGE_NEW: 'message:new',
  MESSAGE_DELETED: 'message:deleted',
} as const;

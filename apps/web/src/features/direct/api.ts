import {
  chatDtoSchema,
  messageDtoSchema,
  userProfileSchema,
  type ChatDto,
  type MessageDto,
  type UserListItem,
  type UserProfile,
} from "@repo/shared";
import { api } from "@/lib/api-client";

/** Endpoint-hoi Chat (Spec 12 §8) tavassuti BFF */

export const getMyProfile = () => api<UserProfile>("/UserProfile/get-my-profile", { schema: userProfileSchema });

export const getChats = () => api<ChatDto[]>("/Chat/get-chats", { schema: chatDtoSchema.array() });

export const getMessages = (chatId: number) =>
  api<MessageDto[]>(`/Chat/get-chat-by-id?chatId=${chatId}`, { schema: messageDtoSchema.array() });

export const createChat = (receiverUserId: string) =>
  api<number>(`/Chat/create-chat?receiverUserId=${encodeURIComponent(receiverUserId)}`, { method: "POST" });

export function sendMessage(chatId: number, text: string, file?: File) {
  const form = new FormData();
  form.set("ChatId", String(chatId));
  if (text) form.set("MessageText", text);
  if (file) form.set("File", file);
  return api<MessageDto>("/Chat/send-message", { method: "PUT", body: form, schema: messageDtoSchema });
}

export const deleteMessage = (messageId: number) =>
  api<boolean>(`/Chat/delete-message?massageId=${messageId}`, { method: "DELETE" });

export const readChat = (chatId: number) =>
  api<{ chatId: number; readAt: string }>(`/Chat/read-chat?chatId=${chatId}`, { method: "POST" });

export const getUnreadCount = () => api<{ count: number }>("/Chat/get-unread-count");

export const deleteChat = (chatId: number) => api<boolean>(`/Chat/delete-chat?chatId=${chatId}`, { method: "DELETE" });

type Paged<T> = { data: T[] };

export async function searchUsers(q: string): Promise<UserListItem[]> {
  const res = await fetch(`/api/User/get-users?UserName=${encodeURIComponent(q)}&PageSize=10`, { credentials: "same-origin" });
  if (!res.ok) return [];
  return ((await res.json()) as Paged<UserListItem>).data;
}

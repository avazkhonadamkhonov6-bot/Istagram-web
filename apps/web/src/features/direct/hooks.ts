"use client";

import { SocketEvent, type ChatDto, type MessageDto } from "@repo/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { toast } from "@/components/ui/toast";
import { getSocket, onReconnect } from "@/lib/socket";
import * as directApi from "./api";

export const directKeys = {
  me: ["me"] as const,
  chats: ["chats"] as const,
  messages: (chatId: number) => ["messages", chatId] as const,
};

/** Paymi optimistic — id-i manfi, to javobi API */
export type UiMessage = MessageDto & { pending?: boolean };

export const useMe = () => useQuery({ queryKey: directKeys.me, queryFn: directApi.getMyProfile, staleTime: 5 * 60_000 });

export const useChats = () => useQuery({ queryKey: directKeys.chats, queryFn: directApi.getChats });

export const useMessages = (chatId: number) =>
  useQuery<UiMessage[]>({ queryKey: directKeys.messages(chatId), queryFn: () => directApi.getMessages(chatId) });

/** Tarafi digari chat (1:1) */
export function peerOf(chat: ChatDto, myId: string | undefined) {
  const isSender = chat.sendUserId === myId;
  return {
    id: isSender ? chat.receiveUserId : chat.sendUserId,
    userName: isSender ? chat.receiveUserName : chat.sendUserName,
    image: isSender ? chat.receiveUserImage : chat.sendUserImage,
  };
}

let tempId = -1;

/** Optimistic: paym favran namoyon meshavad; xato → rollback + toast (Spec 10 §7) */
export function useSendMessage(chatId: number) {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const key = directKeys.messages(chatId);

  return useMutation({
    // Offline → xato (rollback + toast, Spec 10 AC7), na pauza
    networkMode: "always",
    mutationFn: ({ text, file }: { text: string; file?: File }) => directApi.sendMessage(chatId, text, file),
    onMutate: async ({ text, file }) => {
      if (file || !me) return { id: null };
      await qc.cancelQueries({ queryKey: key });
      const id = tempId--;
      const optimistic: UiMessage = {
        messageId: id,
        chatId,
        userId: me.userId,
        userName: me.userName,
        userImage: me.image,
        messageText: text,
        file: null,
        sendMassageDate: new Date().toISOString(),
        pending: true,
      };
      qc.setQueryData<UiMessage[]>(key, (old = []) => [...old, optimistic]);
      return { id };
    },
    onSuccess: (msg, _vars, ctx) => {
      qc.setQueryData<UiMessage[]>(key, (old = []) => {
        const rest = old.filter((m) => m.messageId !== ctx?.id && m.messageId !== msg.messageId);
        return [...rest, msg];
      });
      void qc.invalidateQueries({ queryKey: directKeys.chats });
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.id) qc.setQueryData<UiMessage[]>(key, (old = []) => old.filter((m) => m.messageId !== ctx.id));
      toast.error("Couldn't send message");
    },
  });
}

export function useDeleteMessage(chatId: number) {
  const qc = useQueryClient();
  const key = directKeys.messages(chatId);
  return useMutation({
    networkMode: "always",
    mutationFn: (messageId: number) => directApi.deleteMessage(messageId),
    onMutate: async (messageId) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<UiMessage[]>(key);
      qc.setQueryData<UiMessage[]>(key, (old = []) => old.filter((m) => m.messageId !== messageId));
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      qc.setQueryData(key, ctx?.prev);
      toast.error("Couldn't unsend message");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: directKeys.chats }),
  });
}

/**
 * Realtime-i Direct (FE-15): message:new / message:deleted kesh-ro navsozi mekunand,
 * pas az reconnect — refetch. Toast, agar paym ba chat-i digar omad.
 */
export function useDirectRealtime(activeChatId: number | null) {
  const qc = useQueryClient();
  const active = useRef(activeChatId);
  useEffect(() => {
    active.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    const socket = getSocket();

    const onNew = (msg: MessageDto) => {
      qc.setQueryData<UiMessage[]>(directKeys.messages(msg.chatId), (old) =>
        old && !old.some((m) => m.messageId === msg.messageId) ? [...old, msg] : old,
      );
      void qc.invalidateQueries({ queryKey: directKeys.chats });
      if (active.current !== msg.chatId) {
        toast(msg.userName, { description: msg.messageText ?? "Sent an attachment" });
      }
    };
    const onDeleted = ({ messageId, chatId }: { messageId: number; chatId: number }) => {
      qc.setQueryData<UiMessage[]>(directKeys.messages(chatId), (old) => old?.filter((m) => m.messageId !== messageId));
      void qc.invalidateQueries({ queryKey: directKeys.chats });
    };

    socket.on(SocketEvent.MESSAGE_NEW, onNew);
    socket.on(SocketEvent.MESSAGE_DELETED, onDeleted);
    const off = onReconnect(() => {
      void qc.invalidateQueries({ queryKey: directKeys.chats });
      void qc.invalidateQueries({ queryKey: ["messages"] });
    });
    return () => {
      socket.off(SocketEvent.MESSAGE_NEW, onNew);
      socket.off(SocketEvent.MESSAGE_DELETED, onDeleted);
      off();
    };
  }, [qc]);
}

"use client";

import { countSchema, notificationDtoSchema, SocketEvent, type NotificationDto } from "@repo/shared";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "@/components/ui/toast";
import { api } from "./api-client";
import { getSocket, onReconnect } from "./socket";

/**
 * FE-15: notifications-i realtime (Spec 13 §1).
 * - `useNotificationsUnread()` — badge (nuqtai surkh) dar sidebar
 * - `useNotificationsRealtime()` — `notification:new` → toast + navsozii kesh; pas az reconnect — refetch
 * - `getNotifications()` / `readAllNotifications()` — baroi panel-i FE-12
 */
export const notificationKeys = {
  list: ["notifications"] as const,
  unread: ["notifications-unread"] as const,
};

type Paged<T> = { data: T[]; totalPage: number; pageNumber: number };

export async function getNotifications(page = 1, pageSize = 20): Promise<Paged<NotificationDto>> {
  const res = await fetch(`/api/Notification/get-notifications?PageNumber=${page}&PageSize=${pageSize}`, { credentials: "same-origin" });
  if (!res.ok) throw new Error(`notifications ${res.status}`);
  const body = (await res.json()) as Paged<unknown>;
  return { ...body, data: notificationDtoSchema.array().parse(body.data) };
}

export const readAllNotifications = () => api<boolean>("/Notification/read-all", { method: "PUT" });

export const useNotificationsUnread = () =>
  useQuery({
    queryKey: notificationKeys.unread,
    queryFn: () => api<{ count: number }>("/Notification/get-unread-count", { schema: countSchema }),
    refetchInterval: 60_000,
  });

/** Matn misli Instagram: "ali liked your post." */
export function notificationText(n: NotificationDto): string {
  switch (n.type) {
    case "LIKE":
      return "liked your post.";
    case "COMMENT":
      return `commented: ${n.commentText ?? ""}`;
    case "COMMENT_REPLY":
      return `replied to your comment: ${n.commentText ?? ""}`;
    case "FOLLOW":
      return "started following you.";
  }
}

export function useNotificationsRealtime() {
  const qc = useQueryClient();
  useEffect(() => {
    const socket = getSocket();
    const onNew = (raw: unknown) => {
      const parsed = notificationDtoSchema.safeParse(raw);
      if (!parsed.success) return;
      const n = parsed.data;
      toast(n.actor.userName, { description: notificationText(n) });
      void qc.invalidateQueries({ queryKey: notificationKeys.unread });
      void qc.invalidateQueries({ queryKey: notificationKeys.list });
    };
    socket.on(SocketEvent.NOTIFICATION_NEW, onNew);
    const off = onReconnect(() => {
      void qc.invalidateQueries({ queryKey: notificationKeys.unread });
      void qc.invalidateQueries({ queryKey: notificationKeys.list });
    });
    return () => {
      socket.off(SocketEvent.NOTIFICATION_NEW, onNew);
      off();
    };
  }, [qc]);
}

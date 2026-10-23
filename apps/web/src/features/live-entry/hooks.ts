"use client";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SocketEvent } from "@repo/shared";
import { getLives } from "@/features/rtc/api";
import { getSocket } from "@/lib/socket";
export function useLives(enabled = true) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["lives"],
    queryFn: getLives,
    refetchInterval: 30_000,
    enabled,
  });
  useEffect(() => {
    if (!enabled) return;
    const socket = getSocket();
    const refresh = () => void qc.invalidateQueries({ queryKey: ["lives"] });
    socket.on(SocketEvent.LIVE_STARTED, refresh);
    socket.on(SocketEvent.LIVE_ENDED, refresh);
    return () => {
      socket.off(SocketEvent.LIVE_STARTED, refresh);
      socket.off(SocketEvent.LIVE_ENDED, refresh);
    };
  }, [qc, enabled]);
  return query;
}

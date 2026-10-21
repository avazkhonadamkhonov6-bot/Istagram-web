"use client";

import { io, type Socket } from "socket.io-client";
import { REALTIME_URL } from "./backend-config";

/**
 * Yak socket baroi tamomi ilova (Spec 08).
 * - Har ulanish / reconnect ticket-i nav (60 s) az BFF megirad — JWT-i asosi dar JS nest.
 * - Server ulanishro qat' kard (ticket-i kuhna) → pas az 3 s az nav.
 * - Pas az reconnect — refetch (onReconnect), chunki paymhoi vaqti qat'shavi dar DB hastand.
 */
const WS_URL = REALTIME_URL;

let socket: Socket | null = null;
const reconnectListeners = new Set<() => void>();

async function fetchTicket(): Promise<string> {
  const res = await fetch("/api/realtime/ticket", { credentials: "same-origin" });
  if (!res.ok) throw new Error(`ticket ${res.status}`);
  return ((await res.json()) as { data: string }).data;
}

export function getSocket(): Socket {
  if (socket) return socket;

  let connectedOnce = false;
  const s = io(WS_URL, {
    path: "/ws",
    transports: ["websocket"],
    autoConnect: false,
    auth: (cb) => {
      fetchTicket()
        .then((token) => cb({ token }))
        .catch(() => cb({}));
    },
  });

  s.on("connect", () => {
    if (connectedOnce) reconnectListeners.forEach((fn) => fn());
    connectedOnce = true;
  });
  s.on("disconnect", (reason) => {
    // Socket.IO xud pas az "io server disconnect" reconnect namekunad
    if (reason === "io server disconnect") setTimeout(() => s.connect(), 3000);
  });

  socket = s;
  s.connect();
  return s;
}

/** Callback pas az har reconnect (baroi invalidateQueries) */
export function onReconnect(fn: () => void) {
  reconnectListeners.add(fn);
  return () => {
    reconnectListeners.delete(fn);
  };
}

export function closeSocket() {
  socket?.close();
  socket = null;
}

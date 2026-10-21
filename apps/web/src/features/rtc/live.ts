"use client";

import { ClientEvent, SocketEvent, type LiveCommentDto, type LiveDto, type RtcSignal, type UserShort } from "@repo/shared";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api-client";
import { getSocket, onReconnect } from "@/lib/socket";
import * as rtcApi from "./api";
import { getMedia, Peer, stopStream } from "./peer";

/**
 * Efiri mustaqim (Spec 16 §3). Muallif ba har tamoshobin yak RTCPeerConnection dorad (mesh, to 50).
 * Tartib: tamoshobin `live:join` → muallif `live:viewer-joined` → offer → tamoshobin answer.
 */

type Ack<T = unknown> = { ok: true; data?: T } | { ok: false; code: string };
const emitAck = <T>(event: string, body: unknown) =>
  new Promise<Ack<T>>((resolve) => getSocket().timeout(10_000).emit(event, body, (err: Error | null, ack: Ack<T>) => resolve(err ? { ok: false, code: "TIMEOUT" } : ack)));

export type FloatingHeart = { id: number; left: number };

/** Dil-hoi parvozkunanda (2.5 s) */
function useHearts() {
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);
  const seq = useRef(0);
  const add = useCallback(() => {
    const id = ++seq.current;
    setHearts((h) => [...h.slice(-20), { id, left: 10 + Math.random() * 60 }]);
    setTimeout(() => setHearts((h) => h.filter((x) => x.id !== id)), 2500);
  }, []);
  return { hearts, add };
}

function useLiveComments(liveId: number | null) {
  const [comments, setComments] = useState<LiveCommentDto[]>([]);
  useEffect(() => {
    if (!liveId) return;
    let active = true;
    rtcApi
      .getLiveComments(liveId)
      .then((list) => active && setComments(list))
      .catch(() => undefined);
    const socket = getSocket();
    const onComment = (c: LiveCommentDto) => c.liveId === liveId && setComments((old) => (old.some((o) => o.id === c.id) ? old : [...old.slice(-99), c]));
    socket.on(SocketEvent.LIVE_COMMENT, onComment);
    return () => {
      active = false;
      socket.off(SocketEvent.LIVE_COMMENT, onComment);
    };
  }, [liveId]);
  return comments;
}

/** Muallifi efir: kamera, ogoz / anjom, tamoshobinho, comment-ho, dil-ho */
export function useLiveHost() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [live, setLive] = useState<LiveDto | null>(null);
  const [viewers, setViewers] = useState(0);
  const [viewerList, setViewerList] = useState<UserShort[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const peers = useRef(new Map<string, Peer>());
  const streamRef = useRef<MediaStream | null>(null);
  const liveRef = useRef<LiveDto | null>(null);
  const comments = useLiveComments(live?.liveId ?? null);
  const { hearts, add: addHeart } = useHearts();

  // Kamera pesh az ogoz (preview); "Try again" → attempt + 1
  useEffect(() => {
    let active = true;
    getMedia(true)
      .then((s) => {
        if (!active) return stopStream(s);
        streamRef.current = s;
        setStream(s);
      })
      .catch((err: Error) => setError(err.message));
    return () => {
      active = false;
    };
  }, [attempt]);
  const retry = useCallback(() => {
    setError(null);
    setAttempt((a) => a + 1);
  }, []);

  const closeAll = useCallback(() => {
    peers.current.forEach((p) => p.close());
    peers.current.clear();
  }, []);

  // Socket: tamoshobinho va signal-ho
  useEffect(() => {
    if (!live) return;
    const socket = getSocket();
    const liveId = live.liveId;
    // Join-i takrori (reconnect) → faqat oxirin offer; javobi kuhna ba peer-i nav namerasad
    const joins = new Map<string, number>();
    let seq = 0;
    const onJoined = async ({ liveId: id, user }: { liveId: number; user: UserShort }) => {
      if (id !== liveId || !streamRef.current) return;
      const token = ++seq;
      joins.set(user.id, token);
      const iceServers = await rtcApi.getIceServers();
      if (joins.get(user.id) !== token || !streamRef.current) return;
      peers.current.get(user.id)?.close();
      const peer = new Peer(
        iceServers,
        (signal) => socket.emit(ClientEvent.LIVE_SIGNAL, { liveId, toUserId: user.id, signal }),
        () => undefined,
      );
      peer.addStream(streamRef.current);
      peers.current.set(user.id, peer);
      setViewerList((l) => [user, ...l.filter((u) => u.id !== user.id)]);
      await peer.offer().catch(() => undefined);
    };
    const onLeft = ({ liveId: id, userId }: { liveId: number; userId: string }) => {
      if (id !== liveId) return;
      joins.delete(userId);
      peers.current.get(userId)?.close();
      peers.current.delete(userId);
      setViewerList((l) => l.filter((u) => u.id !== userId));
    };
    const onSignal = ({ liveId: id, fromUserId, signal }: { liveId: number; fromUserId: string; signal: RtcSignal }) => {
      if (id === liveId) void peers.current.get(fromUserId)?.handle(signal);
    };
    const onViewers = ({ liveId: id, viewerCount }: { liveId: number; viewerCount: number }) => id === liveId && setViewers(viewerCount);
    const onHeart = ({ liveId: id }: { liveId: number }) => id === liveId && addHeart();
    const onEnded = (l: LiveDto) => {
      if (l.liveId !== liveId) return;
      closeAll();
      setLive(l);
    };
    socket.on(SocketEvent.LIVE_VIEWER_JOINED, onJoined);
    socket.on(SocketEvent.LIVE_VIEWER_LEFT, onLeft);
    socket.on(SocketEvent.LIVE_SIGNAL, onSignal);
    socket.on(SocketEvent.LIVE_VIEWERS, onViewers);
    socket.on(SocketEvent.LIVE_HEART, onHeart);
    socket.on(SocketEvent.LIVE_ENDED, onEnded);
    return () => {
      socket.off(SocketEvent.LIVE_VIEWER_JOINED, onJoined);
      socket.off(SocketEvent.LIVE_VIEWER_LEFT, onLeft);
      socket.off(SocketEvent.LIVE_SIGNAL, onSignal);
      socket.off(SocketEvent.LIVE_VIEWERS, onViewers);
      socket.off(SocketEvent.LIVE_HEART, onHeart);
      socket.off(SocketEvent.LIVE_ENDED, onEnded);
    };
  }, [live, addHeart, closeAll]);

  const start = useCallback(async (title: string) => {
    if (!streamRef.current) return;
    setStarting(true);
    try {
      getSocket();
      const l = await rtcApi.startLive(title.trim() || undefined);
      liveRef.current = l;
      setLive(l);
    } catch (err) {
      toast.error(err instanceof ApiError && err.code === "LIVE_ALREADY_STARTED" ? "You're already live" : "Couldn't start live video");
    } finally {
      setStarting(false);
    }
  }, []);

  const end = useCallback(async () => {
    const l = liveRef.current;
    closeAll();
    if (!l) return;
    liveRef.current = null;
    const ended = await rtcApi.endLive(l.liveId).catch(() => ({ ...l, status: "ENDED" as const }));
    setLive(ended);
  }, [closeAll]);

  // Bastani sahifa / baromadan → efir tamom, kamera xomush
  useEffect(() => {
    const onUnload = () => {
      const l = liveRef.current;
      if (l) void fetch(`/api/Live/end-live?liveId=${l.liveId}`, { method: "POST", keepalive: true, credentials: "same-origin" });
    };
    window.addEventListener("pagehide", onUnload);
    return () => {
      window.removeEventListener("pagehide", onUnload);
      onUnload();
      closeAll();
      stopStream(streamRef.current);
    };
  }, [closeAll]);

  return { stream, live, viewers, viewerList, comments, hearts, error, starting, start, end, retry };
}

/** Tamoshobini efir */
export function useLiveViewer(liveId: number) {
  const [live, setLive] = useState<LiveDto | null>(null);
  const [remote, setRemote] = useState<MediaStream | null>(null);
  const [viewers, setViewers] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const peer = useRef<Peer | null>(null);
  const comments = useLiveComments(live?.status === "LIVE" ? liveId : null);
  const { hearts, add: addHeart } = useHearts();

  useEffect(() => {
    let active = true;
    const socket = getSocket();
    let hostId: string | null = null;
    // Agar dar 8 s video naoyad (poyga, shabaka) → join-i takrori, muallif offer-i nav mefiristad
    let connected = false;
    let tries = 0;
    let watchdog: ReturnType<typeof setTimeout> | undefined;
    const arm = () => {
      clearTimeout(watchdog);
      watchdog = setTimeout(() => {
        if (active && !connected && tries < 3) {
          tries++;
          socket.emit(ClientEvent.LIVE_LEAVE, { liveId });
          void join();
        }
      }, 8000);
    };

    const join = async () => {
      peer.current?.close();
      peer.current = null;
      connected = false;
      const ack = await emitAck<LiveDto>(ClientEvent.LIVE_JOIN, { liveId });
      if (!active) return;
      if (!ack.ok) {
        if (ack.code === "LIVE_NOT_ACTIVE") setLive((l) => (l ? { ...l, status: "ENDED" } : l));
        else setError(ack.code === "LIVE_FULL" ? "This live video is full" : ack.code === "LIVE_NOT_FOUND" ? "Live video not found" : "Couldn't join live video");
        return;
      }
      if (ack.data) {
        hostId = ack.data.user.id;
        setLive(ack.data);
        setViewers(ack.data.viewerCount);
        arm();
      }
    };

    rtcApi
      .getLive(liveId)
      .then((l) => {
        if (!active) return;
        setLive(l);
        hostId = l.user.id;
        if (l.status === "LIVE") void join();
      })
      .catch((err) => active && setError(err instanceof ApiError && err.status === 404 ? "Live video not found" : "Couldn't load live video"));

    // Signal-ho bo tartib: candidate-ho pesh az sohtani peer gum nameshavand
    let queue: Promise<void> = Promise.resolve();
    const onSignal = ({ liveId: id, fromUserId, signal }: { liveId: number; fromUserId: string; signal: RtcSignal }) => {
      if (id !== liveId || fromUserId !== hostId) return;
      queue = queue
        .then(async () => {
          if (signal.type === "offer") {
            peer.current?.close();
            peer.current = new Peer(
              await rtcApi.getIceServers(),
              (s) => socket.emit(ClientEvent.LIVE_SIGNAL, { liveId, toUserId: fromUserId, signal: s }),
              (stream) => setRemote(stream),
              (state) => {
                if (state === "connected") {
                  connected = true;
                  clearTimeout(watchdog);
                } else if (state === "failed" || state === "disconnected") {
                  connected = false;
                  arm();
                }
              },
            );
          }
          await peer.current?.handle(signal);
        })
        .catch(() => undefined);
    };
    const onViewers = ({ liveId: id, viewerCount }: { liveId: number; viewerCount: number }) => id === liveId && setViewers(viewerCount);
    const onHeart = ({ liveId: id }: { liveId: number }) => id === liveId && addHeart();
    const onEnded = (l: LiveDto) => {
      if (l.liveId !== liveId) return;
      clearTimeout(watchdog);
      peer.current?.close();
      peer.current = null;
      setRemote(null);
      setLive(l);
    };
    socket.on(SocketEvent.LIVE_SIGNAL, onSignal);
    socket.on(SocketEvent.LIVE_VIEWERS, onViewers);
    socket.on(SocketEvent.LIVE_HEART, onHeart);
    socket.on(SocketEvent.LIVE_ENDED, onEnded);
    // Socket-i nav → room-ho gum shudand, az nav join
    const off = onReconnect(() => void join());

    return () => {
      active = false;
      clearTimeout(watchdog);
      off();
      socket.off(SocketEvent.LIVE_SIGNAL, onSignal);
      socket.off(SocketEvent.LIVE_VIEWERS, onViewers);
      socket.off(SocketEvent.LIVE_HEART, onHeart);
      socket.off(SocketEvent.LIVE_ENDED, onEnded);
      socket.emit(ClientEvent.LIVE_LEAVE, { liveId });
      peer.current?.close();
      peer.current = null;
    };
  }, [liveId, addHeart]);

  // Dil ba hama (ba xudam ham) az server meoyad
  const heart = useCallback(() => {
    getSocket().emit(ClientEvent.LIVE_HEART, { liveId });
  }, [liveId]);

  const comment = useCallback(
    async (text: string) => {
      try {
        await rtcApi.addLiveComment(liveId, text);
        return true;
      } catch {
        toast.error("Couldn't post comment");
        return false;
      }
    },
    [liveId],
  );

  return { live, remote, viewers, comments, hearts, error, heart, comment };
}

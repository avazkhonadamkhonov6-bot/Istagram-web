"use client";

import { ClientEvent, SocketEvent, type CallDto, type RtcSignal } from "@repo/shared";
import { create } from "zustand";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api-client";
import { getSocket } from "@/lib/socket";
import * as rtcApi from "./api";
import { getMedia, Peer, stopStream } from "./peer";

/**
 * Zangi audio / video (Spec 16 §2) — yak zang baroi tamomi ilova.
 * Tartibi WebRTC: **ilovashavanda** (kase ki qabul kard) ba har ishtirokchii dar zang offer mefiristad.
 */
export type CallPhase = "idle" | "outgoing" | "incoming" | "active" | "ended";

type CallState = {
  phase: CallPhase;
  call: CallDto | null;
  myId: string | null;
  local: MediaStream | null;
  remotes: Record<string, MediaStream>;
  connected: Record<string, boolean>;
  muted: boolean;
  cameraOff: boolean;
  /** Sabab baroi ekrani "ended" */
  endReason: string | null;
};

const initial: CallState = {
  phase: "idle",
  call: null,
  myId: null,
  local: null,
  remotes: {},
  connected: {},
  muted: false,
  cameraOff: false,
  endReason: null,
};

export const useCallStore = create<CallState>(() => initial);

const peers = new Map<string, Peer>();
// Peer-i dar holati sohtan (getIceServers asinxronist) — to du signal du peer nasozand
const creating = new Map<string, Promise<Peer>>();
let endTimer: ReturnType<typeof setTimeout> | undefined;

const set = useCallStore.setState;
const get = useCallStore.getState;
/** Holati avval, lekin user-i joriro nigoh medorad */
const reset = (patch: Partial<CallState> = {}) => set({ ...initial, myId: get().myId, ...patch });

const errorText = (err: unknown, fallback: string) =>
  err instanceof ApiError && err.code === "CALL_BUSY"
    ? "You're already in a call"
    : err instanceof ApiError && err.code === "BLOCKED"
      ? "You can't call this account"
      : err instanceof Error && !(err instanceof ApiError)
        ? err.message
        : fallback;

function sendSignal(callId: number, toUserId: string, signal: RtcSignal) {
  getSocket().emit(ClientEvent.CALL_SIGNAL, { callId, toUserId, signal });
}

function peerFor(userId: string): Promise<Peer> {
  const existing = peers.get(userId);
  if (existing) return Promise.resolve(existing);
  const pending = creating.get(userId);
  if (pending) return pending;
  const { call } = get();
  if (!call) return Promise.reject(new Error("no call"));
  const callId = call.callId;
  const promise = rtcApi
    .getIceServers()
    .then((iceServers) => {
      const peer = new Peer(
        iceServers,
        (signal) => sendSignal(callId, userId, signal),
        (stream) => set((s) => ({ remotes: { ...s.remotes, [userId]: stream } })),
        (state) => set((s) => ({ connected: { ...s.connected, [userId]: state === "connected" } })),
      );
      const local = get().local;
      if (local) peer.addStream(local);
      peers.set(userId, peer);
      return peer;
    })
    .finally(() => creating.delete(userId));
  creating.set(userId, promise);
  return promise;
}

function closePeer(userId: string) {
  peers.get(userId)?.close();
  peers.delete(userId);
  set((s) => {
    const remotes = { ...s.remotes };
    delete remotes[userId];
    return { remotes };
  });
}

function cleanup(reason: string | null) {
  peers.forEach((p) => p.close());
  peers.clear();
  stopStream(get().local);
  stopRing();
  clearTimeout(endTimer);
  if (!get().call) return reset();
  set({ phase: "ended", local: null, remotes: {}, connected: {}, endReason: reason });
  endTimer = setTimeout(() => reset(), 1500);
}

export function setCallUser(myId: string | undefined) {
  if (myId && get().myId !== myId) set({ myId });
}

/** Zang zadan az header-i chat */
export async function startCall(chatId: number, type: CallDto["type"]) {
  if (get().phase !== "idle" && get().phase !== "ended") return toast.error("You're already in a call");
  clearTimeout(endTimer);
  let local: MediaStream;
  try {
    local = await getMedia(type === "VIDEO");
  } catch (err) {
    return toast.error(errorText(err, "Couldn't start call"));
  }
  reset({ phase: "outgoing", local });
  try {
    const call = await rtcApi.startCall(chatId, type);
    set({ call });
    startRing("outgoing");
  } catch (err) {
    stopStream(local);
    reset();
    toast.error(errorText(err, "Couldn't start call"));
  }
}

export async function acceptCall() {
  const { call, phase } = get();
  if (!call || phase !== "incoming") return;
  stopRing();
  let local: MediaStream;
  try {
    local = await getMedia(call.type === "VIDEO");
  } catch (err) {
    toast.error(errorText(err, "Couldn't join call"));
    return declineCall();
  }
  set({ local, phase: "active" });
  try {
    const dto = await rtcApi.acceptCall(call.callId);
    set({ call: dto });
    // Man ilova shudam → ba hamai dar zang offer
    const myId = get().myId;
    for (const p of dto.participants) {
      if (p.id === myId || !p.joinedAt || p.leftAt) continue;
      const peer = await peerFor(p.id);
      await peer.offer();
    }
  } catch (err) {
    cleanup(null);
    toast.error(errorText(err, "Call has ended"));
  }
}

export async function declineCall() {
  const { call } = get();
  stopRing();
  reset();
  if (call) await rtcApi.declineCall(call.callId).catch(() => undefined);
}

export async function hangUp() {
  const { call } = get();
  cleanup("Call ended");
  if (call) await rtcApi.endCall(call.callId).catch(() => undefined);
}

export function toggleMute() {
  const muted = !get().muted;
  get().local?.getAudioTracks().forEach((t) => (t.enabled = !muted));
  set({ muted });
}

export function toggleCamera() {
  const cameraOff = !get().cameraOff;
  get().local?.getVideoTracks().forEach((t) => (t.enabled = !cameraOff));
  set({ cameraOff });
}

/** Socket: hamai event-hoi `call:*`. Bargardonidani funksiyai off. */
export function bindCallSocket() {
  const socket = getSocket();

  const onIncoming = (call: CallDto) => {
    const { phase } = get();
    // Dar zangi digar → zangi nav intizor memonad (45 s → MISSED)
    if (phase !== "idle" && phase !== "ended") return;
    clearTimeout(endTimer);
    reset({ phase: "incoming", call });
    startRing("incoming");
  };
  const onAccepted = ({ call }: { call: CallDto; userId: string }) => {
    if (get().call?.callId !== call.callId) return;
    stopRing();
    set({ call, phase: get().phase === "outgoing" ? "active" : get().phase });
  };
  const onDeclined = ({ call }: { call: CallDto; userId: string }) => {
    if (get().call?.callId === call.callId) set({ call });
  };
  const onLeft = ({ call, userId }: { call: CallDto; userId: string }) => {
    if (get().call?.callId !== call.callId) return;
    closePeer(userId);
    set({ call });
  };
  const onEnded = (call: CallDto) => {
    if (get().call?.callId !== call.callId) return;
    const reason =
      call.status === "DECLINED" ? "Call declined" : call.status === "MISSED" ? (get().phase === "incoming" ? "Missed call" : "No answer") : "Call ended";
    cleanup(reason);
  };
  const onSignal = async ({ callId, fromUserId, signal }: { callId: number; fromUserId: string; signal: RtcSignal }) => {
    if (get().call?.callId !== callId || get().phase === "ended") return;
    try {
      const peer = await peerFor(fromUserId);
      await peer.handle(signal);
    } catch {
      // Signal-i kuhna (masalan, pas az anjom) — be'ahamiyat
    }
  };

  socket.on(SocketEvent.CALL_INCOMING, onIncoming);
  socket.on(SocketEvent.CALL_ACCEPTED, onAccepted);
  socket.on(SocketEvent.CALL_DECLINED, onDeclined);
  socket.on(SocketEvent.CALL_LEFT, onLeft);
  socket.on(SocketEvent.CALL_ENDED, onEnded);
  socket.on(SocketEvent.CALL_SIGNAL, onSignal);

  // Pas az refresh: zangi voridshavanda hanuz zang mezanad; zange ki dar on budam — tamom (peer-ho gum shudand)
  void rtcApi
    .getActiveCalls()
    .then((calls) => {
      const myId = get().myId;
      for (const c of calls) {
        const me = c.participants.find((p) => p.id === myId);
        if (!me) continue;
        if (c.status === "RINGING" && c.caller.id !== myId && !me.joinedAt) onIncoming(c);
        else if (me.joinedAt && !me.leftAt && get().call?.callId !== c.callId) void rtcApi.endCall(c.callId).catch(() => undefined);
      }
    })
    .catch(() => undefined);

  return () => {
    socket.off(SocketEvent.CALL_INCOMING, onIncoming);
    socket.off(SocketEvent.CALL_ACCEPTED, onAccepted);
    socket.off(SocketEvent.CALL_DECLINED, onDeclined);
    socket.off(SocketEvent.CALL_LEFT, onLeft);
    socket.off(SocketEvent.CALL_ENDED, onEnded);
    socket.off(SocketEvent.CALL_SIGNAL, onSignal);
  };
}

// ---- Ringtone (WebAudio, bidun fayl) ----
let ring: { ctx: AudioContext; timer: ReturnType<typeof setInterval> } | null = null;

function startRing(kind: "incoming" | "outgoing") {
  stopRing();
  try {
    const ctx = new AudioContext();
    const beep = () => {
      const tones = kind === "incoming" ? [880, 660] : [440];
      tones.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = freq;
        gain.gain.value = kind === "incoming" ? 0.12 : 0.06;
        osc.connect(gain).connect(ctx.destination);
        const at = ctx.currentTime + i * 0.25;
        osc.start(at);
        osc.stop(at + 0.22);
      });
    };
    beep();
    ring = { ctx, timer: setInterval(beep, kind === "incoming" ? 1500 : 3000) };
  } catch {
    ring = null;
  }
}

function stopRing() {
  if (!ring) return;
  clearInterval(ring.timer);
  void ring.ctx.close().catch(() => undefined);
  ring = null;
}

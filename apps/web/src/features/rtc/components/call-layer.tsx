"use client";

import { SocketEvent, type LiveDto } from "@repo/shared";
import { useQueryClient } from "@tanstack/react-query";
import { Mic, MicOff, Phone, PhoneOff, SwitchCamera, Video, VideoOff } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { toast } from "@/components/ui/toast";
import { useMe } from "@/features/direct/hooks";
import { instantKeys } from "@/features/instants/api";
import { mediaUrl } from "@/lib/media";
import { getSocket } from "@/lib/socket";
import { cn } from "@/lib/utils";
import {
  acceptCall,
  bindCallSocket,
  declineCall,
  hangUp,
  setCallUser,
  switchCamera,
  toggleCamera,
  toggleMute,
  useCallStore,
} from "../call-store";
import { formatDuration } from "../peer";
import { MediaAudio, MediaVideo } from "./media-video";

// Sahifahoe, ki bidun login kushoda meshavand — dar onho darxosti `me` (401) ba /login nabarad
const PUBLIC = ["/login", "/signup", "/accounts/password/reset"];

/**
 * Qabati global-i zang va efir (Spec 16): zangi voridshavanda dar har sahifa, ekrani zang,
 * xabari "started a live video". Faqat baroi user-i voridshuda.
 */
export function CallLayer() {
  const pathname = usePathname();
  if (PUBLIC.includes(pathname)) return null;
  return <ActiveCallLayer />;
}

function ActiveCallLayer() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: me } = useMe();
  const phase = useCallStore((s) => s.phase);

  // Har render (arzon): store hamesha user-i joriro medonad
  useEffect(() => setCallUser(me?.userId));

  useEffect(() => {
    if (!me?.userId) return;
    const off = bindCallSocket();
    const socket = getSocket();
    const onLive = (live: LiveDto) =>
      toast(`${live.user.userName} started a live video`, {
        description: live.title ?? undefined,
        action: { label: "Watch", onClick: () => router.push(`/live/${live.liveId}`) },
      });
    // Spec 17: instant-i nav az dust — inbox-i Instants foran nav meshavad va xabar dar har sahifa
    const onInstant = (i: { userName: string }) => {
      void qc.invalidateQueries({ queryKey: instantKeys.inbox });
      toast(`${i.userName} sent you an Instant`, {
        action: { label: "View", onClick: () => router.push("/direct/inbox") },
      });
    };
    socket.on(SocketEvent.LIVE_STARTED, onLive);
    socket.on(SocketEvent.INSTANT_NEW, onInstant);
    return () => {
      off();
      socket.off(SocketEvent.LIVE_STARTED, onLive);
      socket.off(SocketEvent.INSTANT_NEW, onInstant);
    };
  }, [me?.userId, router, qc]);

  if (phase === "idle") return null;
  if (phase === "incoming") return <IncomingCall />;
  return <CallScreen />;
}

function useCallPeer() {
  const call = useCallStore((s) => s.call);
  const myId = useCallStore((s) => s.myId);
  if (!call) return null;
  const others = call.participants.filter((p) => p.id !== myId);
  const caller = call.caller.id === myId ? null : call.caller;
  const main = caller ?? others[0] ?? call.caller;
  return {
    name: call.isGroup ? call.title || others.map((o) => o.userName).join(", ") : main.userName,
    avatar: main.avatar,
    isVideo: call.type === "VIDEO",
    others,
  };
}

function IncomingCall() {
  const peer = useCallPeer();
  if (!peer) return null;
  return (
    <div
      role="alertdialog"
      aria-label="Incoming call"
      className="fixed left-1/2 top-4 z-[60] flex w-[calc(100%-32px)] max-w-[380px] -translate-x-1/2 items-center gap-3 rounded-2xl bg-ig-bg-elevated p-4 text-ig-text shadow-ig-strong animate-ig-fade"
    >
      <Avatar src={mediaUrl(peer.avatar)} alt={peer.name} size={56} className="animate-pulse" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{peer.name}</p>
        <p className="text-sm text-ig-text-secondary">{peer.isVideo ? "Incoming video call..." : "Incoming audio call..."}</p>
      </div>
      <button
        type="button"
        aria-label="Decline"
        onClick={() => void declineCall()}
        className="flex size-11 items-center justify-center rounded-full bg-ig-error text-white"
      >
        <PhoneOff className="size-5" />
      </button>
      <button
        type="button"
        aria-label="Accept"
        onClick={() => void acceptCall()}
        className="flex size-11 items-center justify-center rounded-full bg-ig-success text-white"
      >
        {peer.isVideo ? <Video className="size-5" /> : <Phone className="size-5" />}
      </button>
    </div>
  );
}

function useTimer(from: string | null | undefined) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!from) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [from]);
  return from ? formatDuration((now - new Date(from).getTime()) / 1000) : null;
}

/** Shumorai kamera-ho (tugmai ivaz faqat agar >1) */
function useCameraCount() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let active = true;
    void navigator.mediaDevices
      ?.enumerateDevices()
      .then((list) => active && setCount(list.filter((d) => d.kind === "videoinput").length))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);
  return count;
}

function CallScreen() {
  const peer = useCallPeer();
  const { phase, call, local, remotes, connected, muted, cameraOff, facing, endReason } = useCallStore();
  const timer = useTimer(phase === "active" ? call?.answeredAt : null);
  const hasManyCameras = useCameraCount() > 1;
  if (!peer) return null;

  const remoteEntries = Object.entries(remotes);
  const anyConnected = Object.values(connected).some(Boolean);
  const status =
    phase === "ended"
      ? endReason
      : phase === "outgoing"
        ? call
          ? "Ringing..."
          : "Calling..."
        : anyConnected
          ? timer
          : "Connecting...";
  const showVideo = peer.isVideo && phase !== "ended";

  return (
    <div role="dialog" aria-label={`Call with ${peer.name}`} className="fixed inset-0 z-[60] flex flex-col bg-black text-ig-text-on-media">
      {/* Video-hoi tarafi digar; dar audio — faqat ovoz */}
      {showVideo && remoteEntries.length > 0 ? (
        <div className={cn("grid flex-1 gap-1", remoteEntries.length > 1 && "grid-cols-2")}>
          {remoteEntries.map(([id, stream]) => (
            <MediaVideo key={id} stream={stream} className="size-full md:object-contain" />
          ))}
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <Avatar src={mediaUrl(peer.avatar)} alt={peer.name} size={150} />
          {remoteEntries.map(([id, stream]) => (
            <MediaAudio key={id} stream={stream} />
          ))}
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 to-transparent px-6 pb-10 pt-8 text-center">
        <p className="text-xl font-semibold">{peer.name}</p>
        <p className="mt-1 text-sm text-white/80" aria-live="polite">
          {status}
        </p>
      </div>

      {showVideo && local && (
        <MediaVideo
          stream={local}
          muted
          mirror={facing === "user"}
          className={cn(
            "absolute bottom-28 right-4 aspect-[3/4] w-28 rounded-xl border border-white/20 shadow-lg md:w-40",
            cameraOff && "opacity-0",
          )}
        />
      )}

      {phase !== "ended" && (
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-5 bg-gradient-to-t from-black/70 to-transparent pb-8 pt-12">
          <button
            type="button"
            aria-label={muted ? "Unmute" : "Mute"}
            aria-pressed={muted}
            onClick={toggleMute}
            className={cn("flex size-14 items-center justify-center rounded-full", muted ? "bg-white text-black" : "bg-white/20")}
          >
            {muted ? <MicOff className="size-6" /> : <Mic className="size-6" />}
          </button>
          {peer.isVideo && (
            <button
              type="button"
              aria-label={cameraOff ? "Turn camera on" : "Turn camera off"}
              aria-pressed={cameraOff}
              onClick={toggleCamera}
              className={cn("flex size-14 items-center justify-center rounded-full", cameraOff ? "bg-white text-black" : "bg-white/20")}
            >
              {cameraOff ? <VideoOff className="size-6" /> : <Video className="size-6" />}
            </button>
          )}
          {peer.isVideo && hasManyCameras && (
            <button
              type="button"
              aria-label="Switch camera"
              onClick={() => void switchCamera()}
              className="flex size-14 items-center justify-center rounded-full bg-white/20"
            >
              <SwitchCamera className="size-6" />
            </button>
          )}
          <button
            type="button"
            aria-label="End call"
            onClick={() => void hangUp()}
            className="flex size-14 items-center justify-center rounded-full bg-ig-error"
          >
            <PhoneOff className="size-6" />
          </button>
        </div>
      )}
    </div>
  );
}

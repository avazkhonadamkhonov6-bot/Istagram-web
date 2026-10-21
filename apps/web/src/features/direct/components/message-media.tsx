"use client";

import type { MessageDto } from "@repo/shared";
import { Pause, Phone, PhoneMissed, Play, Video } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { startCall } from "@/features/rtc/call-store";
import { formatDuration } from "@/features/rtc/peer";
import { cn } from "@/lib/utils";

/** Paymi ovozi misli Instagram: play / pause, xati pesraft, vaqt */
export function VoiceMessage({ src, durationSec, mine }: { src: string; durationSec: number | null; mine: boolean }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(durationSec ?? 0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onTime = () => setCurrent(el.currentTime);
    const onMeta = () => Number.isFinite(el.duration) && el.duration > 0 && setTotal(el.duration);
    const onEnd = () => {
      setPlaying(false);
      setCurrent(0);
    };
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("ended", onEnd);
    const onPause = () => setPlaying(false);
    const onPlay = () => setPlaying(true);
    el.addEventListener("pause", onPause);
    el.addEventListener("play", onPlay);
    return () => {
      el.removeEventListener("pause", onPause);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("ended", onEnd);
    };
  }, []);

  const progress = total > 0 ? Math.min(1, current / total) : 0;
  return (
    <div className="flex w-60 max-w-full items-center gap-3 px-3 py-2">
      <button
        type="button"
        aria-label={playing ? "Pause voice message" : "Play voice message"}
        onClick={() => {
          const el = ref.current;
          if (!el) return;
          if (el.paused) void el.play().catch(() => undefined);
          else el.pause();
        }}
        className="shrink-0"
      >
        {playing ? <Pause className="size-5" fill="currentColor" /> : <Play className="size-5" fill="currentColor" />}
      </button>
      <div className={cn("h-1 flex-1 overflow-hidden rounded-full", mine ? "bg-white/40" : "bg-ig-stroke")}>
        <div className={cn("h-full rounded-full", mine ? "bg-white" : "bg-ig-text")} style={{ width: `${progress * 100}%` }} />
      </div>
      <span className="shrink-0 text-xs tabular-nums">{formatDuration(playing || current ? current : total)}</span>
      <audio ref={ref} src={src} preload="metadata" />
    </div>
  );
}

/** Paymi video bo davomnoki */
export function VideoMessage({ src, durationSec }: { src: string; durationSec: number | null }) {
  return (
    <div className="relative">
      <video src={src} controls playsInline preload="metadata" className="max-h-80 w-full bg-black" />
      {durationSec !== null && (
        <span className="pointer-events-none absolute right-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[11px] text-white tabular-nums">
          {formatDuration(durationSec)}
        </span>
      )}
    </div>
  );
}

/** Paymi "zang" dar chat (Spec 16 §2): "Video call · 3:12", "Missed audio call", "Call back" */
export function CallMessage({ call, mine, chatId }: { call: NonNullable<MessageDto["call"]>; mine: boolean; chatId: number }) {
  const video = call.type === "VIDEO";
  const kind = video ? "video call" : "audio call";
  const missed = call.status === "MISSED" || call.status === "DECLINED";
  const title =
    call.status === "MISSED"
      ? mine
        ? `${video ? "Video" : "Audio"} call · No answer`
        : `Missed ${kind}`
      : call.status === "DECLINED"
        ? `${video ? "Video" : "Audio"} call declined`
        : call.status === "ENDED"
          ? `${video ? "Video" : "Audio"} call`
          : `${video ? "Video" : "Audio"} call in progress`;
  const Icon = missed ? PhoneMissed : video ? Video : Phone;
  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <span className={cn("flex size-9 items-center justify-center rounded-full", missed ? "bg-ig-error/15 text-ig-error" : "bg-black/10")}>
        <Icon className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{title}</span>
        {call.status === "ENDED" && call.durationSec > 0 && (
          <span className="block text-xs opacity-80">{formatDuration(call.durationSec)}</span>
        )}
        <button type="button" onClick={() => void startCall(chatId, call.type)} className="text-xs font-semibold underline-offset-2 hover:underline">
          Call back
        </button>
      </span>
    </div>
  );
}

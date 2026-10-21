"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/** <video> bo MediaStream (srcObject) */
export function MediaVideo({
  stream,
  muted = false,
  mirror = false,
  className,
}: {
  stream: MediaStream | null;
  muted?: boolean;
  mirror?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.srcObject = stream;
    if (stream) void el.play().catch(() => undefined);
  }, [stream]);
  return <video ref={ref} autoPlay playsInline muted={muted} className={cn("bg-black object-cover", mirror && "-scale-x-100", className)} />;
}

/** Ovozi tarafi digar dar zangi audio (bidun tasvir) */
export function MediaAudio({ stream }: { stream: MediaStream | null }) {
  const ref = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.srcObject = stream;
    if (stream) void el.play().catch(() => undefined);
  }, [stream]);
  return <audio ref={ref} autoPlay />;
}

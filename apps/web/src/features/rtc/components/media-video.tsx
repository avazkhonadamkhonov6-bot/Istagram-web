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
    // Preview-i xud: faqat tasvir — ovozi xud hech goh namebarad (aks-sado "vuuun")
    el.muted = muted;
    el.srcObject = stream && muted ? new MediaStream(stream.getVideoTracks()) : stream;
    return playWhenAllowed(el, stream);
  }, [stream, muted]);
  return <video ref={ref} autoPlay playsInline muted={muted} className={cn("bg-black object-cover", mirror && "-scale-x-100", className)} />;
}

/** Ovozi tarafi digar dar zangi audio (bidun tasvir) */
export function MediaAudio({ stream }: { stream: MediaStream | null }) {
  const ref = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.srcObject = stream;
    return playWhenAllowed(el, stream);
  }, [stream]);
  return <audio ref={ref} autoPlay />;
}

/** Agar brauzer autoplay-ro man kard — bo avvalin klik / lams boz play */
function playWhenAllowed(el: HTMLMediaElement, stream: MediaStream | null) {
  if (!stream) return;
  const retry = () => void el.play().catch(() => undefined);
  void el.play().catch(() => {
    document.addEventListener("pointerdown", retry, { once: true });
    document.addEventListener("keydown", retry, { once: true });
  });
  return () => {
    document.removeEventListener("pointerdown", retry);
    document.removeEventListener("keydown", retry);
  };
}

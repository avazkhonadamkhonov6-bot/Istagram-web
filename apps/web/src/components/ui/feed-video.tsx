"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Play, Volume2, VolumeX } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

// Ovoz baroi hamai video-hoi feed yakest va xomush ogoz meshavad — misli instagram.com
let feedMuted = true;
const listeners = new Set<() => void>();
function setFeedMuted(value: boolean) {
  feedMuted = value;
  listeners.forEach((l) => l());
}
function useFeedMuted() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => feedMuted,
    () => true,
  );
}

/**
 * Video dar post (feed va modal): bidun tugmahoi brauzer, dar ekran (60%) khudkor megardad,
 * click — pause / play, tugmai ovoz dar kunji rost-i poyon.
 */
export function FeedVideo({ src, className }: { src: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const muted = useFeedMuted();
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          el.play().catch(() => undefined);
          setPaused(false);
        } else {
          el.pause();
        }
      },
      { threshold: 0.6 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (ref.current) ref.current.muted = muted;
  }, [muted]);

  const toggle = () => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) {
      el.play().catch(() => undefined);
      setPaused(false);
    } else {
      el.pause();
      setPaused(true);
    }
  };

  return (
    <>
      <video
        ref={ref}
        src={src}
        muted
        loop
        playsInline
        preload="metadata"
        onClick={toggle}
        className={cn("size-full cursor-pointer", className)}
      />
      {paused && (
        <span aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <Play className="size-16 fill-white text-white drop-shadow-lg" />
        </span>
      )}
      <button
        type="button"
        aria-label={muted ? "Unmute" : "Mute"}
        onClick={() => setFeedMuted(!muted)}
        className="absolute bottom-3 right-3 z-10 rounded-full bg-black/60 p-2 text-white"
      >
        {muted ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
      </button>
    </>
  );
}

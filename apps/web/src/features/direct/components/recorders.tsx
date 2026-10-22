"use client";

import { Circle, Square, SwitchCamera, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { MediaVideo } from "@/features/rtc/components/media-video";
import { formatDuration, getMedia, stopStream } from "@/features/rtc/peer";

// MP4 avval: onro hamai brauzerho (iPhone / Safari ham) bozi mekunand; WebM — zaxira
const AUDIO_TYPES = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm", "audio/ogg"];
const VIDEO_TYPES = ["video/mp4", "video/webm;codecs=vp8,opus", "video/webm"];
/** Spec 16 §1: paymi video to 60 s, ovozi — to 5 daqiqa (10 MB) */
export const VIDEO_MESSAGE_MAX_SEC = 60;
const VOICE_MAX_SEC = 300;

const pickType = (types: string[]) => types.find((t) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) ?? "";

function toFile(chunks: Blob[], mime: string, name: string) {
  const type = (mime || "application/octet-stream").split(";")[0]!;
  const blob = new Blob(chunks, { type });
  return blob.size > 0 ? new File([blob], `${name}.${type.split("/")[1]}`, { type }) : null;
}

/** Davomnokii fayli audio / video (baroi fayli intixobshuda) */
export function mediaDuration(file: File): Promise<number | undefined> {
  if (!file.type.startsWith("video/") && !file.type.startsWith("audio/")) return Promise.resolve(undefined);
  return new Promise((resolve) => {
    const el = document.createElement(file.type.startsWith("video/") ? "video" : "audio");
    const url = URL.createObjectURL(file);
    const done = (v?: number) => {
      URL.revokeObjectURL(url);
      resolve(v);
    };
    el.preload = "metadata";
    el.onloadedmetadata = () => done(Number.isFinite(el.duration) ? el.duration : undefined);
    el.onerror = () => done(undefined);
    el.src = url;
  });
}

/** Paymi ovozi (Spec 14 §4, Spec 16 §1): vaqt, bekor kardan, davomnoki */
export function useVoiceRecorder(onDone: (file: File, durationSec: number) => void) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const rec = useRef<MediaRecorder | null>(null);
  const cancelled = useRef(false);
  const startedAt = useRef(0);
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  });

  useEffect(() => {
    if (!recording) return;
    const t = setInterval(() => {
      const sec = (Date.now() - startedAt.current) / 1000;
      setElapsed(sec);
      if (sec >= VOICE_MAX_SEC) rec.current?.stop();
    }, 250);
    return () => clearInterval(t);
  }, [recording]);

  async function start() {
    let stream: MediaStream;
    try {
      stream = await getMedia(false);
    } catch (err) {
      return toast.error((err as Error).message);
    }
    const mimeType = pickType(AUDIO_TYPES);
    const r = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const chunks: Blob[] = [];
    cancelled.current = false;
    r.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    r.onstop = () => {
      stopStream(stream);
      setRecording(false);
      rec.current = null;
      const sec = (Date.now() - startedAt.current) / 1000;
      if (cancelled.current) return;
      if (sec < 1) return toast("Hold to record a voice message");
      const file = toFile(chunks, r.mimeType || mimeType, "voice");
      if (file) doneRef.current(file, sec);
    };
    startedAt.current = Date.now();
    setElapsed(0);
    // Bidun timeslice: dar MP4 qismhoi xurd ovozi avvalro gum mekunand
    r.start();
    rec.current = r;
    setRecording(true);
  }

  const stop = () => rec.current?.state === "recording" && rec.current.stop();
  const cancel = () => {
    cancelled.current = true;
    stop();
  };

  useEffect(
    () => () => {
      cancelled.current = true;
      if (rec.current?.state === "recording") rec.current.stop();
    },
    [],
  );
  return { recording, elapsed, start, stop, cancel };
}

/** Navishtani paymi video bo kamera (to 60 s) */
export function VideoMessageDialog({
  open,
  onOpenChange,
  onSend,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (file: File, durationSec: number) => void;
}) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [preview, setPreview] = useState<{ file: File; url: string; sec: number } | null>(null);
  const rec = useRef<MediaRecorder | null>(null);
  const startedAt = useRef(0);

  // Kamera hangomi kushodan; bastan → hama chiz pok
  useEffect(() => {
    if (!open) return;
    let active = true;
    let s: MediaStream | null = null;
    getMedia(true)
      .then((m) => {
        if (!active) return stopStream(m);
        s = m;
        setStream(m);
      })
      .catch((err: Error) => {
        toast.error(err.message);
        onOpenChange(false);
      });
    return () => {
      active = false;
      if (rec.current?.state === "recording") rec.current.stop();
      stopStream(s);
      setStream(null);
      setRecording(false);
      setElapsed(0);
      setPreview((p) => {
        if (p) URL.revokeObjectURL(p.url);
        return null;
      });
    };
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!recording) return;
    const t = setInterval(() => {
      const sec = (Date.now() - startedAt.current) / 1000;
      setElapsed(sec);
      if (sec >= VIDEO_MESSAGE_MAX_SEC) rec.current?.stop();
    }, 250);
    return () => clearInterval(t);
  }, [recording]);

  function start() {
    if (!stream) return;
    const mimeType = pickType(VIDEO_TYPES);
    const r = new MediaRecorder(stream, { ...(mimeType ? { mimeType } : {}), videoBitsPerSecond: 1_500_000 });
    const chunks: Blob[] = [];
    r.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    r.onstop = () => {
      setRecording(false);
      rec.current = null;
      const sec = (Date.now() - startedAt.current) / 1000;
      const file = toFile(chunks, r.mimeType || mimeType, "video");
      if (file && sec >= 1) setPreview({ file, url: URL.createObjectURL(file), sec });
    };
    startedAt.current = Date.now();
    setElapsed(0);
    r.start();
    rec.current = r;
    setRecording(true);
  }

  function retake() {
    setPreview((p) => {
      if (p) URL.revokeObjectURL(p.url);
      return null;
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] bg-black text-white" showClose={false}>
        <DialogTitle className="sr-only">Video message</DialogTitle>
        <div className="relative aspect-[3/4] w-full">
          {preview ? (
            <video src={preview.url} controls autoPlay playsInline className="size-full bg-black object-cover" />
          ) : (
            <MediaVideo stream={stream} muted mirror className="size-full" />
          )}
          <button
            type="button"
            aria-label="Close"
            onClick={() => onOpenChange(false)}
            className="absolute left-3 top-3 rounded-full bg-black/50 p-1.5"
          >
            <X className="size-5" />
          </button>
          {(recording || preview) && (
            <span className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-sm tabular-nums">
              {recording && <span className="size-2 animate-pulse rounded-full bg-ig-error" />}
              {formatDuration(preview ? preview.sec : elapsed)} / {formatDuration(VIDEO_MESSAGE_MAX_SEC)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-center gap-6 p-4">
          {preview ? (
            <>
              <button type="button" onClick={retake} className="text-sm font-semibold">
                Retake
              </button>
              <button
                type="button"
                onClick={() => {
                  onSend(preview.file, preview.sec);
                  onOpenChange(false);
                }}
                className="rounded-lg bg-ig-primary px-5 py-2 text-sm font-semibold text-ig-text-on-color hover:bg-ig-primary-hover"
              >
                Send
              </button>
            </>
          ) : (
            <button
              type="button"
              aria-label={recording ? "Stop recording" : "Start recording"}
              disabled={!stream}
              onClick={recording ? () => rec.current?.stop() : start}
              className="flex size-16 items-center justify-center rounded-full border-4 border-white disabled:opacity-40"
            >
              {recording ? <Square className="size-6 text-ig-error" fill="currentColor" /> : <Circle className="size-11 text-ig-error" fill="currentColor" />}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Aksi fawri bo kamera (misli tugmai kamera dar Direct-i Instagram) */
export function PhotoCaptureDialog({
  open,
  onOpenChange,
  onSend,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (file: File) => void;
}) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [shot, setShot] = useState<{ file: File; url: string } | null>(null);
  const videoBox = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    let s: MediaStream | null = null;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 1280 } }, audio: false })
      .then((m) => {
        if (!active) return stopStream(m);
        s = m;
        setStream(m);
      })
      .catch(() => {
        toast.error("Camera is not available. Allow camera access in the browser.");
        onOpenChange(false);
      });
    return () => {
      active = false;
      stopStream(s);
      setStream(null);
    };
  }, [open, facing, onOpenChange]);

  const close = (value: boolean) => {
    if (!value) retake();
    onOpenChange(value);
  };

  function capture() {
    const video = videoBox.current?.querySelector("video");
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Kamerai pesh oinavor nishon doda meshavad — aks ham hamon xel boshad
    if (facing === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" });
        setShot({ file, url: URL.createObjectURL(file) });
      },
      "image/jpeg",
      0.9,
    );
  }

  function retake() {
    setShot((p) => {
      if (p) URL.revokeObjectURL(p.url);
      return null;
    });
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-[420px] bg-black text-white" showClose={false}>
        <DialogTitle className="sr-only">Take a photo</DialogTitle>
        <div ref={videoBox} className="relative aspect-[3/4] w-full">
          {shot ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shot.url} alt="Captured photo" className="size-full bg-black object-cover" />
          ) : (
            <MediaVideo stream={stream} muted mirror={facing === "user"} className="size-full" />
          )}
          <button
            type="button"
            aria-label="Close"
            onClick={() => close(false)}
            className="absolute left-3 top-3 rounded-full bg-black/50 p-1.5"
          >
            <X className="size-5" />
          </button>
          {!shot && (
            <button
              type="button"
              aria-label="Switch camera"
              onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))}
              className="absolute right-3 top-3 rounded-full bg-black/50 p-1.5"
            >
              <SwitchCamera className="size-5" />
            </button>
          )}
        </div>
        <div className="flex items-center justify-center gap-6 p-4">
          {shot ? (
            <>
              <button type="button" onClick={retake} className="text-sm font-semibold">
                Retake
              </button>
              <button
                type="button"
                onClick={() => {
                  onSend(shot.file);
                  close(false);
                }}
                className="rounded-lg bg-ig-primary px-5 py-2 text-sm font-semibold text-ig-text-on-color hover:bg-ig-primary-hover"
              >
                Send
              </button>
            </>
          ) : (
            <button
              type="button"
              aria-label="Take photo"
              disabled={!stream}
              onClick={capture}
              className="flex size-16 items-center justify-center rounded-full border-4 border-white disabled:opacity-40"
            >
              <Circle className="size-12 text-white" fill="currentColor" />
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

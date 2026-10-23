"use client";

import type { InstantDto } from "@repo/shared";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, Camera, ChevronLeft, Eye, RefreshCw, Star, Trash2, X, Zap, ZapOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import { boostExposure, captureFrames, enhance } from "../enhance";
import { addInstant, deleteInstant, getInstantArchive, getInstants, instantKeys, viewInstant } from "../api";

type Mode = "camera" | "viewer" | "archive";

const FLASH_KEY = "ig-instant-flash";
// Chand ms ekran safed pesh az aks — kamera ravshaniro qabul kunad
const FLASH_MS = 600;

const TILT = [-8, 6, -2];

/** Tudai aksho-i kaj, misli "pile"-i Instants dar Instagram */
function Pile({ photos, size }: { photos: (string | null)[]; size: number }) {
  return (
    <span className="relative block" style={{ width: size, height: size * 1.25 }}>
      {photos.slice(0, 3).map((src, i) => (
        <span
          key={i}
          className="absolute inset-0 overflow-hidden rounded-lg border-2 border-white bg-ig-bg-secondary shadow-ig-strong"
          style={{ rotate: `${TILT[i]}deg` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {src && <img src={src} alt="" className="size-full object-cover" />}
        </span>
      ))}
    </span>
  );
}

/**
 * Instants (Spec 17) dar inbox-i Direct: tugmai shinovar dar kunji rost-i poyon.
 * Instant-i nadida boshad — tuda va shumora; bo click → binanda, vagarna → kamera.
 */
export function InstantsButton() {
  const { data: inbox = [] } = useQuery({ queryKey: instantKeys.inbox, queryFn: getInstants, refetchInterval: 60_000 });
  const [mode, setMode] = useState<Mode | null>(null);

  return (
    <>
      <button
        type="button"
        aria-label={inbox.length ? `Instants, ${inbox.length} new` : "Send an Instant"}
        title="Instants"
        onClick={() => setMode(inbox.length ? "viewer" : "camera")}
        className="absolute bottom-6 right-6 z-10 flex items-center justify-center transition-transform active:scale-95"
      >
        {inbox.length ? (
          <span className="relative">
            <Pile photos={inbox.map((i) => mediaUrl(i.fileName))} size={48} />
            <span className="absolute -right-2 -top-2 flex min-w-5 items-center justify-center rounded-full bg-ig-badge px-1 text-xs font-semibold leading-5 text-ig-text-on-color">
              {inbox.length}
            </span>
          </span>
        ) : (
          <span className="flex size-14 items-center justify-center rounded-2xl border border-ig-separator bg-ig-bg-elevated text-ig-icon shadow-ig-strong">
            <Zap className="size-6" />
          </span>
        )}
      </button>

      <DialogPrimitive.Root open={mode !== null} onOpenChange={(o) => !o && setMode(null)}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="ig-dialog-overlay fixed inset-0 z-50 bg-black" />
          <DialogPrimitive.Content
            aria-describedby={undefined}
            className="fixed inset-0 z-50 flex flex-col bg-black text-ig-text-on-media outline-none"
          >
            {mode === "viewer" && <Viewer items={inbox} onDone={() => setMode("camera")} />}
            {mode === "camera" && <InstantCamera onArchive={() => setMode("archive")} />}
            {mode === "archive" && <InstantArchive onBack={() => setMode("camera")} />}
            <DialogPrimitive.Close aria-label="Close" className="absolute right-4 top-4 z-20 rounded-full p-1.5 hover:bg-white/10">
              <X className="size-7" />
            </DialogPrimitive.Close>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}

/** Yak bor didan: har aks hangomi namoyish "seen" meshavad, click → navbati */
function Viewer({ items, onDone }: { items: InstantDto[]; onDone: () => void }) {
  const qc = useQueryClient();
  // Ruyxati avvaliro negoh medorem — refetch dar vaqti didan tartibro vayron nakunad
  const [queue] = useState(items);
  const [index, setIndex] = useState(0);
  const current = queue[index];

  useEffect(() => {
    if (current) viewInstant(current.id).catch(() => undefined);
  }, [current]);

  const next = () => {
    if (index + 1 < queue.length) return setIndex(index + 1);
    const seen = new Set(queue.map((i) => i.id));
    qc.setQueryData<InstantDto[]>(instantKeys.inbox, (old = []) => old.filter((i) => !seen.has(i.id)));
    onDone();
  };

  if (!current) return null;
  return (
    <>
      <DialogPrimitive.Title className="sr-only">Instants</DialogPrimitive.Title>
      <div className="flex gap-1 px-4 pt-3">
        {queue.map((i, n) => (
          <span key={i.id} className={cn("h-0.5 flex-1 rounded-full", n <= index ? "bg-white" : "bg-white/35")} />
        ))}
      </div>
      <header className="flex items-center gap-3 px-4 py-3 pr-16">
        <Avatar src={mediaUrl(current.userImage)} alt={current.userName} size={32} />
        <span className="text-sm font-semibold">{current.userName}</span>
        <span className="text-sm text-white/70">{formatRelativeTime(current.createdAt)}</span>
        {current.closeFriends && (
          <span className="flex items-center gap-1 rounded-full bg-ig-close-friends px-2 py-0.5 text-xs font-semibold">
            <Star className="size-3 fill-current" /> Close friends
          </span>
        )}
      </header>
      <button type="button" aria-label="Next Instant" onClick={next} className="flex min-h-0 flex-1 items-center justify-center p-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={current.id}
          src={mediaUrl(current.fileName) ?? ""}
          alt={`Instant from ${current.userName}`}
          className="max-h-full max-w-full rounded-2xl border-[6px] border-white object-contain shadow-ig-strong"
          style={{ rotate: `${TILT[index % TILT.length]! / 4}deg` }}
        />
      </button>
      <p className="pb-6 text-center text-xs text-white/70">Tap to see the next one. Instants disappear after you see them.</p>
    </>
  );
}

/** Kamera-i Instant: be tahrir va be galereya — aks girifta, foran firistoda meshavad, bo "Undo" */
function InstantCamera({ onArchive }: { onArchive: () => void }) {
  const qc = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // Flash: dar kompyuter — ekrani safed (front flash), dar telefon — ham chirog-i kamera (torch).
  // Intixob nigoh doshta meshavad; peshfarz — fa'ol
  const [flashOn, setFlashOn] = useState(() => {
    try {
      return localStorage.getItem(FLASH_KEY) !== "off";
    } catch {
      return true;
    }
  });
  const [lighting, setLighting] = useState(false);
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [closeFriends, setCloseFriends] = useState(false);
  // Kamerae, ki kushoda nashud (ijozat nest yo dastgoh nest)
  const [failed, setFailed] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  // Instant-i oxirin firistoda — bar-i "Undo" dar poyoni kamera (toast-i umumi zeri dialog memonad)
  const [sent, setSent] = useState<InstantDto | null>(null);
  // Xatoho dar dokhili ekran — toast zeri dialog namoyon nest
  const [failure, setFailure] = useState<string | null>(null);
  const error = failed === facing || !navigator.mediaDevices?.getUserMedia;

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;
    if (!navigator.mediaDevices?.getUserMedia) return;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: facing, aspectRatio: 3 / 4, height: { ideal: 1280 } }, audio: false })
      .then((s) => {
        if (cancelled) return s.getTracks().forEach((t) => t.stop());
        stream = s;
        streamRef.current = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(() => !cancelled && setFailed(facing));
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [facing]);

  useEffect(() => {
    if (!sent) return;
    const t = setTimeout(() => setSent(null), 5000);
    return () => clearTimeout(t);
  }, [sent]);
  useEffect(() => {
    if (!failure) return;
    const t = setTimeout(() => setFailure(null), 4000);
    return () => clearTimeout(t);
  }, [failure]);

  const undo = useMutation({
    mutationFn: deleteInstant,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: instantKeys.archive });
      setSent(null);
    },
    onError: () => setFailure("Couldn't unsend Instant"),
  });
  const send = useMutation({
    mutationFn: (photo: Blob) => addInstant(photo, closeFriends),
    onSuccess: (instant) => {
      qc.invalidateQueries({ queryKey: instantKeys.archive });
      setFailure(null);
      setSent(instant);
    },
    onError: () => setFailure("Couldn't send Instant. Try again."),
  });

  const toggleFlash = () =>
    setFlashOn((on) => {
      try {
        localStorage.setItem(FLASH_KEY, on ? "off" : "on");
      } catch {}
      return !on;
    });

  const capture = useCallback(async (boost: boolean) => {
    const video = videoRef.current;
    if (!video?.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d", { willReadFrequently: boost });
    if (!ctx) return;
    // Kamerai pesh oinavor namoyon meshavad — aks ham hamon tavr
    const mirror = facing === "user";
    if (boost) {
      // Flash ("night mode"): 8 kadr → miyona (shovqin kam), white balance, denoise, ravshani
      const img = await captureFrames(video, ctx, mirror);
      enhance(img);
      ctx.putImageData(img, 0, 0);
    } else {
      if (mirror) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0);
    }
    setFlash(true);
    setTimeout(() => setFlash(false), 150);
    canvas.toBlob((blob) => blob && send.mutate(blob), "image/jpeg", 0.9);
  }, [facing, send]);

  const shoot = useCallback(async () => {
    if (!flashOn) return capture(false);
    setLighting(true);
    // Kamera: exposure-i baland va torch (agar dastgiri kunad)
    const restore = await boostExposure(streamRef.current?.getVideoTracks()[0]);
    try {
      // Kamera ba ravshanii nav moslashavad (auto-exposure), ba'd kadrho — ekran to oxir safed
      await new Promise((r) => setTimeout(r, FLASH_MS));
      await capture(true);
    } finally {
      setLighting(false);
      await restore();
    }
  }, [flashOn, capture]);

  return (
    <>
      <DialogPrimitive.Title className="px-4 pt-5 text-center text-base font-semibold">Instants</DialogPrimitive.Title>
      <div className="flex justify-center pt-3">
        <div role="radiogroup" aria-label="Audience" className="flex rounded-full bg-white/15 p-1 text-sm font-semibold">
          {[
            { value: false, label: "Friends" },
            { value: true, label: "Close friends" },
          ].map((o) => (
            <button
              key={o.label}
              type="button"
              role="radio"
              aria-checked={closeFriends === o.value}
              onClick={() => setCloseFriends(o.value)}
              className={cn(
                "flex items-center gap-1 rounded-full px-4 py-1.5",
                closeFriends === o.value && (o.value ? "bg-ig-close-friends" : "bg-white text-black"),
              )}
            >
              {o.value && <Star className="size-3.5 fill-current" />}
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center p-4">
        <div className="relative aspect-[3/4] h-full max-h-[70vh] max-w-full overflow-hidden rounded-3xl bg-ig-bg-secondary">
          {error ? (
            <div className="flex size-full flex-col items-center justify-center gap-3 p-6 text-center">
              <Camera className="size-10" />
              <p className="text-sm font-semibold">Allow camera access</p>
              <p className="text-xs text-white/70">Instants are taken with your camera. Turn on camera access in your browser to send one.</p>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              // Bo flash preview ham ravshantar — taqriban misli aksi natija
              style={flashOn ? { filter: "brightness(1.25)" } : undefined}
              className={cn("size-full object-cover", facing === "user" && "-scale-x-100")}
            />
          )}
          {flash && <span className="absolute inset-0 bg-white" />}
          {!error && (
            <button
              type="button"
              aria-label={flashOn ? "Flash on" : "Flash off"}
              aria-pressed={flashOn}
              onClick={toggleFlash}
              className="absolute right-3 top-3 z-10 rounded-full bg-black/40 p-2 backdrop-blur hover:bg-black/60"
            >
              {flashOn ? <Zap className="size-5 fill-current" /> : <ZapOff className="size-5" />}
            </button>
          )}
          {failure && (
            <p role="alert" className="absolute inset-x-3 bottom-3 rounded-xl bg-ig-toast px-4 py-3 text-center text-sm font-semibold shadow-ig-strong">
              {failure}
            </p>
          )}
          {sent && !failure && (
            <div role="status" className="absolute inset-x-3 bottom-3 flex items-center gap-3 rounded-xl bg-ig-toast p-2 pr-4 text-sm shadow-ig-strong">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mediaUrl(sent.fileName) ?? ""} alt="" className="h-10 w-8 rounded object-cover" />
              <span className="flex-1 font-semibold">{sent.closeFriends ? "Sent to Close friends" : "Sent to friends"}</span>
              <button
                type="button"
                disabled={undo.isPending}
                onClick={() => undo.mutate(sent.id)}
                className="font-semibold underline-offset-2 hover:underline"
              >
                Undo
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between px-10 pb-4">
        <button type="button" onClick={onArchive} aria-label="Instants archive" className="rounded-full p-2 hover:bg-white/10">
          <Archive className="size-7" />
        </button>
        <button
          type="button"
          aria-label="Take Instant"
          disabled={error || send.isPending || lighting}
          onClick={() => void shoot()}
          className="size-[72px] rounded-full border-4 border-white p-1 transition-transform active:scale-90 disabled:opacity-40"
        >
          <span className="block size-full rounded-full bg-white" />
        </button>
        <button
          type="button"
          aria-label="Flip camera"
          onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))}
          className="rounded-full p-2 hover:bg-white/10"
        >
          <RefreshCw className="size-7" />
        </button>
      </div>
      <p className="pb-5 text-center text-xs text-white/60">Shared with your followers. Seen once, gone in 24 hours.</p>
      {/* Front flash: ekrani safed ruyro ravshan mekunad; asosi — korkardi aks (brighten) */}
      {lighting && <div aria-hidden className="fixed inset-0 z-[60] bg-white" />}
    </>
  );
}

/** Archive-i Instants-i man: faqat muallif mebinad, 1 sol */
function InstantArchive({ onBack }: { onBack: () => void }) {
  const qc = useQueryClient();
  const { data, isPending, isError } = useQuery({ queryKey: instantKeys.archive, queryFn: getInstantArchive });
  const [now] = useState(Date.now);
  const remove = useMutation({
    mutationFn: deleteInstant,
    onSuccess: (_, id) => qc.setQueryData<InstantDto[]>(instantKeys.archive, (old = []) => old.filter((i) => i.id !== id)),
  });

  return (
    <>
      <header className="flex items-center gap-2 px-4 py-4 pr-16">
        <button type="button" aria-label="Back" onClick={onBack} className="rounded-full p-1.5 hover:bg-white/10">
          <ChevronLeft className="size-7" />
        </button>
        <DialogPrimitive.Title className="text-base font-semibold">Instants archive</DialogPrimitive.Title>
      </header>
      <p className="px-6 pb-3 text-xs text-white/70">Only you can see your archive. Instants are kept for one year.</p>
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {isPending && <p className="p-6 text-center text-sm text-white/70">Loading...</p>}
        {(isError || remove.isError) && (
          <p role="alert" className="p-6 text-center text-sm text-white/70">
            {isError ? "Couldn't load your Instants." : "Couldn't delete Instant."}
          </p>
        )}
        {data?.length === 0 && <p className="p-6 text-center text-sm text-white/70">No Instants yet.</p>}
        <ul className="grid grid-cols-3 gap-1 sm:grid-cols-4">
          {data?.map((i) => {
            const active = new Date(i.expiresAt).getTime() > now;
            return (
              <li key={i.id} className="group relative aspect-[3/4] overflow-hidden rounded-lg bg-ig-bg-secondary">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mediaUrl(i.fileName) ?? ""} alt="" className="size-full object-cover" />
                <span className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 px-2 pb-1.5 pt-4 text-xs">
                  <span className="flex items-center gap-1">
                    <Eye className="size-3.5" /> {i.viewCount ?? 0}
                  </span>
                  <span>{active ? formatRelativeTime(i.createdAt) : new Date(i.createdAt).toLocaleDateString()}</span>
                </span>
                {i.closeFriends && (
                  <Star aria-label="Close friends" className="absolute left-1.5 top-1.5 size-4 fill-ig-close-friends text-ig-close-friends" />
                )}
                <button
                  type="button"
                  aria-label="Delete Instant"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate(i.id)}
                  className="absolute right-1 top-1 rounded-full bg-black/50 p-1.5 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}

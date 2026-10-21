"use client";

import type { LiveCommentDto } from "@repo/shared";
import { useQuery } from "@tanstack/react-query";
import { Eye, Heart, Radio, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { formatRelativeTime } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import { getLives } from "../api";
import { useLiveHost, useLiveViewer, type FloatingHeart } from "../live";
import { formatDuration } from "../peer";
import { MediaVideo } from "./media-video";

/** Nishoni surxi "LIVE" */
function LiveBadge() {
  return <span className="rounded bg-gradient-to-r from-[#d300c5] to-[#ff0069] px-1.5 py-0.5 text-xs font-bold tracking-wide text-white">LIVE</span>;
}

function Hearts({ hearts }: { hearts: FloatingHeart[] }) {
  return (
    <div className="pointer-events-none absolute bottom-20 right-4 h-64 w-16" aria-hidden>
      {hearts.map((h) => (
        <Heart
          key={h.id}
          className="live-heart absolute bottom-0 size-7 text-[#ff3040]"
          fill="currentColor"
          style={{ left: `${h.left}%` }}
        />
      ))}
      <style>{`
        .live-heart { animation: live-heart 2.5s ease-out forwards; }
        @keyframes live-heart {
          0% { transform: translateY(0) scale(0.6); opacity: 0; }
          15% { opacity: 1; transform: translateY(-20px) scale(1); }
          100% { transform: translateY(-240px) scale(1.1); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function Comments({ comments }: { comments: LiveCommentDto[] }) {
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [comments.length]);
  return (
    <div className="max-h-[40%] overflow-y-auto px-4 [mask-image:linear-gradient(to_bottom,transparent,black_30%)]" aria-live="polite">
      <ul className="flex flex-col gap-2 pt-8">
        {comments.map((c) => (
          <li key={c.id} className="flex items-start gap-2 text-sm text-white drop-shadow">
            <Avatar src={mediaUrl(c.user.avatar)} alt={c.user.userName} size={24} />
            <span className="min-w-0">
              <span className="font-semibold">{c.user.userName}</span> <span className="break-words">{c.text}</span>
            </span>
          </li>
        ))}
      </ul>
      <div ref={bottom} />
    </div>
  );
}

function useElapsed(from: string | null | undefined) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!from) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [from]);
  return from ? formatDuration((now - new Date(from).getTime()) / 1000) : "";
}

/** /live/new — muallif */
export function LiveHostView() {
  const router = useRouter();
  const host = useLiveHost();
  const [title, setTitle] = useState("");
  const elapsed = useElapsed(host.live?.status === "LIVE" ? host.live.startedAt : null);
  const isLive = host.live?.status === "LIVE";
  const ended = host.live?.status === "ENDED";

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-black text-white md:static md:mx-auto md:my-6 md:h-[calc(100dvh-48px)] md:max-w-[480px] md:overflow-hidden md:rounded-xl">
      <div className="relative flex-1 overflow-hidden">
        {host.error ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
            <p className="text-sm">{host.error}</p>
            <button type="button" onClick={host.retry} className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black">
              Try again
            </button>
          </div>
        ) : !host.stream ? (
          <div className="flex h-full items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <MediaVideo stream={host.stream} muted mirror className={cn("size-full", ended && "opacity-30")} />
        )}

        <div className="absolute inset-x-0 top-0 flex items-center gap-2 bg-gradient-to-b from-black/60 to-transparent p-4">
          {isLive && (
            <>
              <LiveBadge />
              <span className="flex items-center gap-1 rounded bg-black/50 px-1.5 py-0.5 text-xs">
                <Eye className="size-3.5" /> {host.viewers}
              </span>
              <span className="text-xs tabular-nums text-white/80">{elapsed}</span>
            </>
          )}
          <span className="flex-1" />
          {isLive ? (
            <button type="button" onClick={() => void host.end()} className="rounded-lg bg-ig-error px-3 py-1.5 text-sm font-semibold">
              End
            </button>
          ) : (
            <button type="button" aria-label="Close" onClick={() => router.push("/live")} className="rounded-full bg-black/40 p-1.5">
              <X className="size-5" />
            </button>
          )}
        </div>

        {isLive && (
          <>
            <Hearts hearts={host.hearts} />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent pb-4">
              <Comments comments={host.comments} />
              {host.viewerList.length > 0 && (
                <p className="mt-2 px-4 text-xs text-white/70">
                  Watching: {host.viewerList.slice(0, 3).map((u) => u.userName).join(", ")}
                  {host.viewerList.length > 3 && ` +${host.viewerList.length - 3}`}
                </p>
              )}
            </div>
          </>
        )}

        {ended && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
            <p className="text-lg font-semibold">Live video ended</p>
            <p className="text-sm text-white/70">{host.live?.peakViewers ?? 0} {host.live?.peakViewers === 1 ? "person" : "people"} watched at the peak</p>
            <Link href="/live" className="mt-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black">
              Done
            </Link>
          </div>
        )}
      </div>

      {!host.live && host.stream && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void host.start(title);
          }}
          className="flex flex-col gap-3 p-4"
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            placeholder="Add a title..."
            className="rounded-lg bg-white/10 px-3 py-2 text-sm outline-none placeholder:text-white/50"
          />
          <button
            type="submit"
            disabled={host.starting}
            className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#d300c5] to-[#ff0069] py-2.5 text-sm font-semibold disabled:opacity-60"
          >
            {host.starting ? <Spinner /> : <Radio className="size-4" />} Go live
          </button>
        </form>
      )}
    </div>
  );
}

/** /live/[id] — tamoshobin */
export function LiveViewerView({ liveId }: { liveId: number }) {
  const router = useRouter();
  const v = useLiveViewer(liveId);
  const [text, setText] = useState("");
  const elapsed = useElapsed(v.live?.status === "LIVE" ? v.live.startedAt : null);
  const ended = v.live?.status === "ENDED";

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-black text-white md:static md:mx-auto md:my-6 md:h-[calc(100dvh-48px)] md:max-w-[480px] md:overflow-hidden md:rounded-xl">
      <div className="relative flex-1 overflow-hidden">
        {v.remote && !ended ? (
          <MediaVideo stream={v.remote} className="size-full" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
            {v.error ? (
              <p className="text-sm">{v.error}</p>
            ) : ended ? (
              <>
                {v.live && <Avatar src={mediaUrl(v.live.user.avatar)} alt={v.live.user.userName} size={77} />}
                <p className="text-lg font-semibold">Live video ended</p>
                <Link href="/live" className="mt-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black">
                  Back to live videos
                </Link>
              </>
            ) : (
              <>
                <Spinner />
                <p className="text-sm text-white/70">Connecting...</p>
              </>
            )}
          </div>
        )}

        <div className="absolute inset-x-0 top-0 flex items-center gap-2 bg-gradient-to-b from-black/60 to-transparent p-4">
          {v.live && (
            <Link href={`/${v.live.user.userName}`} className="flex min-w-0 items-center gap-2">
              <Avatar src={mediaUrl(v.live.user.avatar)} alt={v.live.user.userName} size={32} />
              <span className="truncate text-sm font-semibold">{v.live.user.userName}</span>
            </Link>
          )}
          {v.live?.status === "LIVE" && (
            <>
              <LiveBadge />
              <span className="flex items-center gap-1 rounded bg-black/50 px-1.5 py-0.5 text-xs">
                <Eye className="size-3.5" /> {v.viewers}
              </span>
              <span className="text-xs tabular-nums text-white/80">{elapsed}</span>
            </>
          )}
          <span className="flex-1" />
          <button type="button" aria-label="Close" onClick={() => router.push("/live")} className="rounded-full bg-black/40 p-1.5">
            <X className="size-5" />
          </button>
        </div>
        {v.live?.title && !ended && <p className="absolute left-4 top-16 text-sm text-white/90 drop-shadow">{v.live.title}</p>}

        {!ended && v.live && (
          <>
            <Hearts hearts={v.hearts} />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent pb-3">
              <Comments comments={v.comments} />
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const value = text.trim();
                  if (!value) return;
                  setText("");
                  if (!(await v.comment(value))) setText(value);
                }}
                className="mt-3 flex items-center gap-3 px-4"
              >
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={150}
                  placeholder="Comment..."
                  className="min-w-0 flex-1 rounded-full border border-white/40 bg-transparent px-4 py-2 text-sm outline-none placeholder:text-white/60"
                />
                <button type="button" aria-label="Send a heart" onClick={v.heart} className="text-white">
                  <Heart className="size-7" />
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** /live — efirhoi faoli odamone ki man follow mekunam */
export function LiveList() {
  const { data, isPending, isError, refetch } = useQuery({ queryKey: ["lives"], queryFn: getLives, refetchInterval: 15_000 });
  return (
    <div className="mx-auto max-w-[600px] px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Live videos</h1>
        <Link
          href="/live/new"
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#d300c5] to-[#ff0069] px-4 py-2 text-sm font-semibold text-white"
        >
          <Radio className="size-4" /> Go live
        </Link>
      </div>
      {isPending && (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}
      {isError && (
        <button type="button" onClick={() => refetch()} className="w-full py-8 text-sm text-ig-text-secondary">
          Couldn&apos;t load live videos. Tap to retry.
        </button>
      )}
      {data && data.length === 0 && (
        <p className="py-12 text-center text-sm text-ig-text-secondary">No one you follow is live right now.</p>
      )}
      <ul className="flex flex-col gap-2">
        {data?.map((l) => (
          <li key={l.liveId}>
            <Link href={`/live/${l.liveId}`} className="flex items-center gap-3 rounded-xl p-2 hover:bg-ig-hover-overlay">
              <span className="rounded-full bg-gradient-to-r from-[#d300c5] to-[#ff0069] p-[2px]">
                <Avatar src={mediaUrl(l.user.avatar)} alt={l.user.userName} size={56} className="border-2 border-ig-bg-primary" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{l.user.userName}</span>
                <span className="block truncate text-sm text-ig-text-secondary">
                  {l.title ?? "Live video"} · started {formatRelativeTime(l.startedAt)}
                </span>
              </span>
              <LiveBadge />
              <span className="flex items-center gap-1 text-sm text-ig-text-secondary">
                <Eye className="size-4" /> {l.viewerCount}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

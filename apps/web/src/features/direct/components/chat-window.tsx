"use client";

import { ChevronLeft, Heart, ImageIcon, LogOut, Mic, Reply, Square, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ErrorFallback } from "@/components/error-fallback";
import { Avatar } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api-client";
import { formatRelativeTime } from "@/lib/format";
import { isVideoFile, mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import { deleteChat, leaveGroup } from "../api";
import {
  directKeys,
  peerOf,
  useChats,
  useDeleteMessage,
  useLikeMessage,
  useMarkRead,
  useMe,
  useMessages,
  usePeerTyping,
  useSendMessage,
  useTypingEmitter,
  type UiMessage,
} from "../hooks";

const GAP_MS = 15 * 60_000;
const AUDIO_TYPES = ["audio/webm", "audio/ogg", "audio/mp4"];

/** Paymi ovozi bo MediaRecorder (Spec 14 §4, <= 10 MB) */
function useVoiceRecorder(onDone: (file: File) => void) {
  const [recording, setRecording] = useState(false);
  const rec = useRef<MediaRecorder | null>(null);

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = AUDIO_TYPES.find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
      const r = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const chunks: Blob[] = [];
      r.ondataavailable = (e) => chunks.push(e.data);
      r.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const type = (r.mimeType || "audio/webm").split(";")[0]!;
        const blob = new Blob(chunks, { type });
        if (blob.size > 0) onDone(new File([blob], `voice.${type.split("/")[1]}`, { type }));
      };
      r.start();
      rec.current = r;
      setRecording(true);
    } catch {
      toast.error("Microphone is not available");
    }
  }

  function stop() {
    rec.current?.stop();
    rec.current = null;
    setRecording(false);
  }

  useEffect(() => () => rec.current?.stop(), []);
  return { recording, start, stop };
}

export function ChatWindow({ chatId }: { chatId: number }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: me } = useMe();
  const { data: chats } = useChats();
  const { data: messages, isPending, isError, error, refetch } = useMessages(chatId);
  const send = useSendMessage(chatId);
  const remove = useDeleteMessage(chatId);
  const like = useLikeMessage(chatId);
  const peerTyping = usePeerTyping(chatId);
  const typing = useTypingEmitter(chatId);
  useMarkRead(chatId, messages, me?.userId);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<UiMessage | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const voice = useVoiceRecorder((file) => send.mutate({ text: "", file }));

  const chat = chats?.find((c) => c.chatId === chatId);
  const peer = chat ? peerOf(chat, me?.userId) : null;
  const isGroup = !!chat?.isGroup;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages?.length, peerTyping]);

  // "Seen" zeri paymi oxirini xud, agar tarafi digar pas az on xondaast (Spec 13 §4)
  const last = messages?.[messages.length - 1];
  const seen =
    !!last && last.userId === me?.userId && !last.pending && !!chat?.peerReadAt && chat.peerReadAt >= last.sendMassageDate;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    send.mutate({ text: value, replyTo });
    setText("");
    setReplyTo(null);
    typing.stop();
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) send.mutate({ text: "", file, replyTo });
    setReplyTo(null);
  }

  async function removeChat() {
    if (!window.confirm(isGroup ? "Leave this group?" : "Delete this chat?")) return;
    try {
      await (isGroup ? leaveGroup(chatId) : deleteChat(chatId));
      await qc.invalidateQueries({ queryKey: directKeys.chats });
      router.push("/direct/inbox");
    } catch {
      toast.error(isGroup ? "Couldn't leave group" : "Couldn't delete chat");
    }
  }

  function startReply(m: UiMessage) {
    setReplyTo(m);
    inputRef.current?.focus();
  }

  const forbidden = error instanceof ApiError && error.status === 403;

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col">
      <header className="flex h-[75px] items-center gap-3 border-b border-ig-separator px-4">
        <Link href="/direct/inbox" aria-label="Back" className="text-ig-icon md:hidden">
          <ChevronLeft className="size-7" />
        </Link>
        {peer && (
          <>
            <Avatar src={mediaUrl(peer.image)} alt={peer.userName} size={44} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-base font-semibold">{peer.userName}</span>
              {isGroup && chat && (
                <span className="block truncate text-xs text-ig-text-secondary">{chat.members.length} members</span>
              )}
            </span>
            <button
              type="button"
              aria-label={isGroup ? "Leave group" : "Delete chat"}
              onClick={removeChat}
              className="text-ig-icon hover:text-ig-error"
            >
              {isGroup ? <LogOut className="size-6" /> : <Trash2 className="size-6" />}
            </button>
          </>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {isPending && (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        )}
        {forbidden && <p className="py-8 text-center text-sm text-ig-text-secondary">You don&apos;t have access to this chat.</p>}
        {isError && !forbidden && <ErrorFallback compact title="Couldn't load messages" onRetry={() => refetch()} />}
        {messages && (
          <MessageList
            messages={messages}
            myId={me?.userId}
            isGroup={isGroup}
            onUnsend={(id) => remove.mutate(id)}
            onLike={(id) => like.mutate(id)}
            onReply={startReply}
          />
        )}
        {seen && <p className="mt-1 text-right text-xs text-ig-text-secondary">Seen</p>}
        {peerTyping && peer && (
          <p className="mt-2 text-xs text-ig-text-secondary" aria-live="polite">
            {isGroup ? "Someone" : peer.userName} is typing...
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      {replyTo && (
        <div className="mx-4 flex items-center gap-3 border-t border-ig-separator pt-2 text-xs">
          <div className="min-w-0 flex-1">
            <p className="font-semibold">
              Replying to {replyTo.userId === me?.userId ? "yourself" : replyTo.userName}
            </p>
            <p className="truncate text-ig-text-secondary">{replyTo.messageText ?? "Attachment"}</p>
          </div>
          <button type="button" aria-label="Cancel reply" onClick={() => setReplyTo(null)} className="text-ig-icon">
            <X className="size-4" />
          </button>
        </div>
      )}

      <form onSubmit={submit} className="m-4 flex items-center gap-3 rounded-full border border-ig-stroke px-4 py-2">
        {voice.recording ? (
          <span className="flex flex-1 items-center gap-2 py-1.5 text-sm text-ig-error" aria-live="polite">
            <span className="size-2 animate-pulse rounded-full bg-ig-error" />
            Recording...
          </span>
        ) : (
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (e.target.value) typing.onInput();
            }}
            placeholder="Message..."
            maxLength={1000}
            className="flex-1 bg-transparent py-1.5 text-sm outline-none placeholder:text-ig-input-placeholder"
          />
        )}
        {text.trim() && !voice.recording ? (
          <button type="submit" className="text-sm font-semibold text-ig-link hover:text-ig-link-action">
            Send
          </button>
        ) : (
          <>
            <button
              type="button"
              aria-label={voice.recording ? "Stop recording" : "Record voice message"}
              onClick={voice.recording ? voice.stop : voice.start}
              className={cn("text-ig-icon", voice.recording && "text-ig-error")}
            >
              {voice.recording ? <Square className="size-5" fill="currentColor" /> : <Mic className="size-6" />}
            </button>
            {!voice.recording && (
              <button type="button" aria-label="Send photo or video" onClick={() => fileRef.current?.click()} className="text-ig-icon">
                {send.isPending ? <Spinner /> : <ImageIcon className="size-6" />}
              </button>
            )}
          </>
        )}
        <input ref={fileRef} type="file" accept="image/*,video/mp4,video/webm" hidden onChange={onFile} />
      </form>
    </section>
  );
}

function MessageList({
  messages,
  myId,
  isGroup,
  onUnsend,
  onLike,
  onReply,
}: {
  messages: UiMessage[];
  myId?: string;
  isGroup: boolean;
  onUnsend: (id: number) => void;
  onLike: (id: number) => void;
  onReply: (m: UiMessage) => void;
}) {
  // Sarlavhai vaqt, agar bayni paymho > 15 daqiqa
  const rows = useMemo(
    () =>
      messages.map((m, i) => {
        const prev = messages[i - 1];
        const showTime = !prev || new Date(m.sendMassageDate).getTime() - new Date(prev.sendMassageDate).getTime() > GAP_MS;
        return { m, showTime, showName: isGroup && m.userId !== myId && (showTime || prev?.userId !== m.userId) };
      }),
    [messages, isGroup, myId],
  );

  if (messages.length === 0) return <p className="py-8 text-center text-sm text-ig-text-secondary">Say hi to start the conversation.</p>;

  return (
    <ul className="flex flex-col gap-1">
      {rows.map(({ m, showTime, showName }) => {
        const mine = m.userId === myId;
        const file = mediaUrl(m.file);
        const isAudio = m.fileType === "audio";
        const liked = !!myId && m.likes.includes(myId);
        const media = (file && !isAudio) || m.sharedPost || m.story;
        return (
          <li key={m.messageId} className="flex flex-col">
            {showTime && (
              <time className="my-3 text-center text-xs text-ig-text-secondary">{formatRelativeTime(m.sendMassageDate)}</time>
            )}
            {showName && <span className="ml-12 mt-1 text-xs text-ig-text-secondary">{m.userName}</span>}
            {m.replyTo && (
              <div className={cn("mt-1 flex flex-col text-xs", mine ? "items-end" : "items-start", !mine && isGroup && "ml-10")}>
                <span className="text-ig-text-secondary">
                  {mine ? "You replied" : `${m.userName} replied`} to {m.replyTo.userName}
                </span>
                <span className="mt-0.5 max-w-[60%] truncate rounded-[18px] bg-ig-bg-secondary px-3 py-1.5 text-ig-text-secondary">
                  {m.replyTo.text ?? "Attachment"}
                </span>
              </div>
            )}
            <div className={cn("group flex items-end gap-2", mine ? "flex-row-reverse" : "flex-row")}>
              {!mine && isGroup && <Avatar src={mediaUrl(m.userImage)} alt={m.userName} size={24} />}
              <div className="relative max-w-[70%]">
                <div
                  onDoubleClick={() => !m.pending && onLike(m.messageId)}
                  className={cn(
                    "overflow-hidden rounded-[22px] text-[15px]",
                    media ? "" : "px-3 py-2",
                    mine ? "ig-bubble-out" : "ig-bubble-in",
                    m.pending && "opacity-60",
                  )}
                >
                  {file &&
                    (isAudio ? (
                      <audio src={file} controls className="h-10 w-60 max-w-full" />
                    ) : isVideoFile(m.file!) ? (
                      <video src={file} controls className="max-h-80 w-full" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={file} alt="" className="max-h-80 w-full object-cover" />
                    ))}
                  {m.sharedPost && <SharedPostCard post={m.sharedPost} />}
                  {m.story && <StoryCard story={m.story} mine={mine} />}
                  {m.messageText && <p className={cn("whitespace-pre-wrap break-words", media && "px-3 py-2")}>{m.messageText}</p>}
                </div>
                {m.likes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onLike(m.messageId)}
                    aria-label={liked ? "Unlike" : "Like"}
                    className={cn(
                      "absolute -bottom-3 flex items-center gap-0.5 rounded-full border-2 border-ig-bg-primary bg-ig-bg-secondary px-1 py-0.5 text-[11px] text-ig-badge",
                      mine ? "right-2" : "left-2",
                    )}
                  >
                    <Heart className="size-3" fill="currentColor" />
                    {m.likes.length > 1 && <span className="text-ig-text">{m.likes.length}</span>}
                  </button>
                )}
              </div>
              {!m.pending && (
                <span className="invisible flex items-center gap-2 group-hover:visible">
                  <button type="button" aria-label="Like" onClick={() => onLike(m.messageId)} className="text-ig-icon">
                    <Heart className={cn("size-4", liked && "text-ig-badge")} fill={liked ? "currentColor" : "none"} />
                  </button>
                  <button type="button" aria-label="Reply" onClick={() => onReply(m)} className="text-ig-icon">
                    <Reply className="size-4" />
                  </button>
                  {mine && (
                    <button
                      type="button"
                      onClick={() => onUnsend(m.messageId)}
                      className="text-xs text-ig-text-secondary hover:text-ig-error"
                    >
                      Unsend
                    </button>
                  )}
                </span>
              )}
            </div>
            {m.likes.length > 0 && <span className="h-3" />}
          </li>
        );
      })}
    </ul>
  );
}

/** Posti share-shuda dar Direct (Spec 13 §4) */
function SharedPostCard({ post }: { post: NonNullable<UiMessage["sharedPost"]> }) {
  const image = mediaUrl(post.image);
  return (
    <Link href={`/p/${post.postId}`} className="block w-56">
      <span className="block px-3 py-2 text-sm font-semibold">{post.userName}</span>
      {image &&
        (isVideoFile(post.image!) ? (
          <video src={image} muted className="aspect-square w-full object-cover" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={`Post by ${post.userName}`} className="aspect-square w-full object-cover" />
        ))}
    </Link>
  );
}

/** Javob ba story yo story-i share-shuda (Spec 14 §3) */
function StoryCard({ story, mine }: { story: NonNullable<UiMessage["story"]>; mine: boolean }) {
  const url = mediaUrl(story.fileName);
  return (
    <div className="w-40">
      <span className="block px-3 pt-2 text-xs text-ig-text-secondary">
        {mine ? `You replied to ${story.userName}'s story` : "Replied to your story"}
      </span>
      {story.isExpired || !url ? (
        <p className="px-3 py-6 text-center text-xs text-ig-text-secondary">Story unavailable</p>
      ) : isVideoFile(story.fileName!) ? (
        <video src={url} muted className="mt-2 aspect-[9/16] w-full object-cover" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={`Story by ${story.userName}`} className="mt-2 aspect-[9/16] w-full object-cover" />
      )}
    </div>
  );
}

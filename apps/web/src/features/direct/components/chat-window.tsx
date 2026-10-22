"use client";

import { ChevronLeft, Heart, ImageIcon, Info, Mic, Pencil, Phone, Reply, Send, Video, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ErrorFallback } from "@/components/error-fallback";
import { Avatar } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { startCall, useCallStore } from "@/features/rtc/call-store";
import { formatDuration } from "@/features/rtc/peer";
import { ApiError } from "@/lib/api-client";
import { formatRelativeTime } from "@/lib/format";
import { isVideoFile, mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import {
  activityLabel,
  peerOf,
  useChats,
  useDeleteMessage,
  useEditMessage,
  useLikeMessage,
  useMarkRead,
  useMe,
  useMessages,
  usePeerTyping,
  useSendMessage,
  useTypingEmitter,
  type UiMessage,
} from "../hooks";
import { CallMessage, VideoMessage, VoiceMessage } from "./message-media";
import { ChatDetails } from "./chat-details";
import { mediaDuration, useVoiceRecorder, VideoMessageDialog } from "./recorders";

const GAP_MS = 15 * 60_000;
/** Spec 15 §3 */
const EDIT_WINDOW_MS = 15 * 60_000;

export function ChatWindow({ chatId }: { chatId: number }) {
  const { data: me } = useMe();
  const { data: chats } = useChats();
  const { data: messages, isPending, isError, error, refetch } = useMessages(chatId);
  const send = useSendMessage(chatId);
  const remove = useDeleteMessage(chatId);
  const like = useLikeMessage(chatId);
  const edit = useEditMessage(chatId);
  const peerTyping = usePeerTyping(chatId);
  const typing = useTypingEmitter(chatId);
  useMarkRead(chatId, messages, me?.userId);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<UiMessage | null>(null);
  const [editing, setEditing] = useState<UiMessage | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const voice = useVoiceRecorder((file, durationSec) => send.mutate({ text: "", file, durationSec }));
  const [videoOpen, setVideoOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const inCall = useCallStore((st) => st.phase !== "idle" && st.phase !== "ended");

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
    if (editing) {
      if (value !== editing.messageText) edit.mutate({ messageId: editing.messageId, text: value });
      setEditing(null);
      setText("");
      return;
    }
    send.mutate({ text: value, replyTo });
    setText("");
    setReplyTo(null);
    typing.stop();
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    const reply = replyTo;
    setReplyTo(null);
    if (!file) return;
    send.mutate({ text: "", file, replyTo: reply, durationSec: await mediaDuration(file) });
  }

  function startReply(m: UiMessage) {
    setEditing(null);
    setReplyTo(m);
    inputRef.current?.focus();
  }

  function startEdit(m: UiMessage) {
    setReplyTo(null);
    setEditing(m);
    setText(m.messageText ?? "");
    inputRef.current?.focus();
  }

  const status = chat && !isGroup ? activityLabel(chat.peerIsOnline, chat.peerLastActiveAt) : null;

  const forbidden = error instanceof ApiError && error.status === 403;

  return (
    <div className="flex h-full min-w-0 flex-1">
    <section className={cn("flex h-full min-w-0 flex-1 flex-col", detailsOpen && "hidden md:flex")}>
      <header className="flex h-[75px] items-center gap-3 border-b border-ig-separator px-4">
        <Link href="/direct/inbox" aria-label="Back" className="text-ig-icon md:hidden">
          <ChevronLeft className="size-7" />
        </Link>
        {peer && (
          <>
            <button
              type="button"
              onClick={() => setDetailsOpen(true)}
              aria-label={isGroup ? "Group details" : "Conversation details"}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
              {isGroup && chat && chat.members.length > 1 ? (
                <span className="relative size-11 shrink-0">
                  {chat.members
                    .filter((m) => m.id !== me?.userId)
                    .slice(0, 2)
                    .map((m, i) => (
                      <Avatar
                        key={m.id}
                        src={mediaUrl(m.avatar)}
                        alt={m.userName}
                        size={32}
                        className={cn("absolute ring-2 ring-ig-bg", i === 0 ? "left-0 top-0" : "bottom-0 right-0")}
                      />
                    ))}
                </span>
              ) : (
                <Avatar src={mediaUrl(peer.image)} alt={peer.userName} size={44} />
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-base font-semibold">{peer.userName}</span>
                {isGroup && chat && (
                  <span className="block truncate text-xs text-ig-text-secondary">{chat.members.length} members</span>
                )}
                {status && <span className="block truncate text-xs text-ig-text-secondary">{status}</span>}
              </span>
            </button>
            <button
              type="button"
              aria-label="Audio call"
              disabled={inCall}
              onClick={() => void startCall(chatId, "AUDIO")}
              className="text-ig-icon disabled:opacity-40"
            >
              <Phone className="size-6" />
            </button>
            <button
              type="button"
              aria-label="Video call"
              disabled={inCall}
              onClick={() => void startCall(chatId, "VIDEO")}
              className="text-ig-icon disabled:opacity-40"
            >
              <Video className="size-6" />
            </button>
            <button
              type="button"
              aria-label="Conversation information"
              aria-pressed={detailsOpen}
              onClick={() => setDetailsOpen((v) => !v)}
              className="text-ig-icon"
            >
              <Info className="size-6" fill={detailsOpen ? "currentColor" : "none"} stroke={detailsOpen ? "rgb(var(--ig-primary-background))" : "currentColor"} />
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
            chatId={chatId}
            isGroup={isGroup}
            onUnsend={(id) => remove.mutate(id)}
            onLike={(id) => like.mutate(id)}
            onReply={startReply}
            onEdit={startEdit}
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

      {editing && (
        <div className="mx-4 flex items-center gap-3 border-t border-ig-separator pt-2 text-xs">
          <p className="flex-1 font-semibold">Edit message</p>
          <button
            type="button"
            aria-label="Cancel edit"
            onClick={() => {
              setEditing(null);
              setText("");
            }}
            className="text-ig-icon"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

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
          <>
            <button type="button" aria-label="Cancel recording" onClick={voice.cancel} className="text-ig-icon hover:text-ig-error">
              <X className="size-5" />
            </button>
            <span className="flex flex-1 items-center gap-2 py-1.5 text-sm" aria-live="polite">
              <span className="size-2 animate-pulse rounded-full bg-ig-error" />
              <span className="tabular-nums">{formatDuration(voice.elapsed)}</span>
              <span className="text-ig-text-secondary">Recording...</span>
            </span>
            <button type="button" aria-label="Send voice message" onClick={voice.stop} className="text-ig-borderless hover:text-ig-borderless-hover">
              <Send className="size-5" />
            </button>
          </>
        ) : (
          <>
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
            {text.trim() ? (
              <button type="submit" className="text-sm font-semibold text-ig-borderless hover:text-ig-borderless-hover">
                {editing ? "Save" : "Send"}
              </button>
            ) : (
              <>
                <button type="button" aria-label="Record voice message" onClick={() => void voice.start()} className="text-ig-icon">
                  <Mic className="size-6" />
                </button>
                <button type="button" aria-label="Record video message" onClick={() => setVideoOpen(true)} className="text-ig-icon">
                  <Video className="size-6" />
                </button>
                <button type="button" aria-label="Send photo or video" onClick={() => fileRef.current?.click()} className="text-ig-icon">
                  {send.isPending ? <Spinner /> : <ImageIcon className="size-6" />}
                </button>
              </>
            )}
          </>
        )}
        <input ref={fileRef} type="file" accept="image/*,video/mp4,video/webm,video/quicktime" hidden onChange={(e) => void onFile(e)} />
      </form>
      <VideoMessageDialog
        open={videoOpen}
        onOpenChange={setVideoOpen}
        onSend={(file, durationSec) => send.mutate({ text: "", file, durationSec })}
      />
    </section>
    {detailsOpen && chat && <ChatDetails chat={chat} myId={me?.userId} onClose={() => setDetailsOpen(false)} />}
    </div>
  );
}

function MessageList({
  messages,
  myId,
  chatId,
  isGroup,
  onUnsend,
  onLike,
  onReply,
  onEdit,
}: {
  messages: UiMessage[];
  myId?: string;
  chatId: number;
  isGroup: boolean;
  onUnsend: (id: number) => void;
  onLike: (id: number) => void;
  onReply: (m: UiMessage) => void;
  onEdit: (m: UiMessage) => void;
}) {
  // Vaqti joriy baroi "Edit" (har daqiqa navsozi)
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

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
        const isCall = !!m.call;
        const editable = mine && !!m.messageText && !file && now - new Date(m.sendMassageDate).getTime() < EDIT_WINDOW_MS;
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
                    media || isAudio || isCall ? "" : "px-3 py-2",
                    mine ? "ig-bubble-out" : "ig-bubble-in",
                    m.pending && "opacity-60",
                  )}
                >
                  {file &&
                    (isAudio ? (
                      <VoiceMessage src={file} durationSec={m.durationSec} mine={mine} />
                    ) : m.fileType === "video" || isVideoFile(m.file!) ? (
                      <VideoMessage src={file} durationSec={m.durationSec} />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={file} alt="" className="max-h-80 w-full object-cover" />
                    ))}
                  {m.call && <CallMessage call={m.call} mine={mine} chatId={chatId} />}
                  {m.sharedPost && <SharedPostCard post={m.sharedPost} />}
                  {m.story && <StoryCard story={m.story} mine={mine} />}
                  {m.messageText && <p className={cn("whitespace-pre-wrap break-words", media && "px-3 py-2")}>{m.messageText}</p>}
                </div>
                {m.likes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onLike(m.messageId)}
                    aria-label={`${m.likes.length} ${m.likes.length === 1 ? "like" : "likes"}`}
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
                  {editable && (
                    <button type="button" aria-label="Edit" onClick={() => onEdit(m)} className="text-ig-icon">
                      <Pencil className="size-4" />
                    </button>
                  )}
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
            {m.editedAt && (
              <span className={cn("mt-0.5 text-[11px] text-ig-text-secondary", mine ? "self-end pr-2" : "pl-2", !mine && isGroup && "ml-8")}>
                Edited
              </span>
            )}
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

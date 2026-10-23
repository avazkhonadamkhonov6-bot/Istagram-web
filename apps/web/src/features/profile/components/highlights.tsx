"use client";
import type { HighlightDto } from "@repo/shared";
import { useState } from "react";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import {
  getHighlights,
  getHighlightStories,
  getStoryArchive,
  addHighlight,
  deleteHighlight,
} from "@/features/social/api";
import { getMyStories, updateHighlight } from "@/features/integrations/api";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { mediaUrl, isVideoFile } from "@/lib/media";
import { toast } from "@/components/ui/toast";
export function Highlights({
  userId,
  isSelf,
  initialData,
}: {
  userId: string;
  isSelf: boolean;
  initialData?: HighlightDto[];
}) {
  const client = useQueryClient();
  const list = useQuery({
    initialData,
    queryKey: ["highlights", userId],
    queryFn: () => getHighlights(userId),
  });
  const [id, setId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [ids, setIds] = useState<number[]>([]);
  const [index, setIndex] = useState(0);
  const [confirm, setConfirm] = useState(false);
  const stories = useQuery({
    queryKey: ["highlight-stories", id],
    queryFn: () => getHighlightStories(id!),
    enabled: open && id !== null,
  });
  const archive = useQuery({
    queryKey: ["highlight-story-picker"],
    queryFn: async () => {
      const [active, past] = await Promise.all([
        getMyStories(),
        getStoryArchive(),
      ]);
      return [
        ...new Map([...active.stories, ...past].map((s) => [s.id, s])).values(),
      ];
    },
    enabled: open && editing && isSelf,
  });
  const action = useMutation({
    mutationFn: async (kind: "save" | "delete") =>
      kind === "delete"
        ? deleteHighlight(id!)
        : id === null
          ? addHighlight(title.trim(), ids)
          : updateHighlight(id, title.trim(), ids),
    onSuccess: () => {
      setOpen(false);
      void client.invalidateQueries({ queryKey: ["highlights"] });
      void client.invalidateQueries({ queryKey: ["highlight-stories"] });
    },
    onError: (error) => toast.error(error.message),
  });
  const story = stories.data?.[index];
  return (
    <div className="ig-profile-highlights flex gap-5 overflow-x-auto">
      {list.isError && (
        <button
          className="text-ig-link-action"
          onClick={() => void list.refetch()}
        >
          Retry highlights
        </button>
      )}
      {(list.data ?? []).map((h) => (
        <button
          key={h.id}
          onClick={() => {
            setId(h.id);
            setTitle(h.title);
            setIndex(0);
            setEditing(false);
            setConfirm(false);
            setOpen(true);
          }}
          className="flex w-[86px] shrink-0 flex-col items-center gap-2"
        >
          <span className="grid size-[86px] place-items-center overflow-hidden rounded-full border-2 border-ig-stroke">
            {h.cover && isVideoFile(h.cover) ? (
              <video
                src={mediaUrl(h.cover)!}
                muted
                playsInline
                preload="metadata"
                className="size-full object-cover"
              />
            ) : h.cover ? (
              <Image
                unoptimized
                src={mediaUrl(h.cover)!}
                alt=""
                width={86}
                height={86}
                className="size-full object-cover"
              />
            ) : (
              <span>{h.title.slice(0, 1)}</span>
            )}
          </span>
          <b className="w-full truncate text-xs">{h.title}</b>
        </button>
      ))}
      {isSelf && (
        <button
          onClick={() => {
            setId(null);
            setIds([]);
            setTitle("");
            setEditing(true);
            setOpen(true);
          }}
          aria-label="New highlight"
        >
          <span>
            <Plus className="size-12 stroke-1" />
          </span>
          <b>New</b>
        </button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[560px] overflow-y-auto p-6">
          <DialogTitle>
            {editing
              ? id === null
                ? "New highlight"
                : "Edit highlight"
              : title}
          </DialogTitle>
          <DialogDescription className="my-3">
            {editing
              ? "Choose your stories and a title."
              : "Stories saved to this highlight."}
          </DialogDescription>
          {editing ? (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                action.mutate("save");
              }}
            >
              <input
                aria-label="Highlight title"
                maxLength={30}
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded border border-ig-stroke bg-transparent p-3"
              />
              {archive.isPending && <p role="status">Loading your stories…</p>}
              {archive.isError && (
                <button type="button" onClick={() => void archive.refetch()}>
                  Retry stories
                </button>
              )}
              <div className="grid max-h-[45dvh] grid-cols-3 gap-2 overflow-y-auto">
                {archive.data?.map((s) => (
                  <label
                    key={s.id}
                    className="relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-lg bg-ig-secondary"
                  >
                    {s.fileName && isVideoFile(s.fileName) && (
                      <video
                        src={mediaUrl(s.fileName)!}
                        muted
                        playsInline
                        preload="metadata"
                        className="absolute size-full object-cover"
                      />
                    )}
                    {s.fileName && !isVideoFile(s.fileName) && (
                      <Image
                        unoptimized
                        src={mediaUrl(s.fileName)!}
                        width={150}
                        height={200}
                        alt={`Story ${s.id}`}
                        className="absolute size-full object-cover"
                      />
                    )}
                    <span className="absolute bottom-2 left-2 rounded bg-ig-bg px-2 py-1 text-xs">
                      Story {s.id}
                    </span>
                    <input
                      aria-label={`Include story ${s.id}`}
                      type="checkbox"
                      className="absolute right-2 top-2"
                      checked={ids.includes(s.id)}
                      onChange={(e) =>
                        setIds((old) =>
                          e.target.checked
                            ? [...old, s.id]
                            : old.filter((x) => x !== s.id),
                        )
                      }
                    />
                  </label>
                ))}
              </div>
              {!archive.isPending && archive.data?.length === 0 && (
                <p>No stories available. Create a story first.</p>
              )}
              <Button
                type="submit"
                disabled={
                  action.isPending ||
                  !title.trim() ||
                  ids.length === 0 ||
                  ids.length > 100
                }
              >
                Save highlight
              </Button>
            </form>
          ) : (
            <>
              {stories.isPending && <p role="status">Loading highlight…</p>}
              {stories.isError && (
                <button onClick={() => void stories.refetch()}>
                  Retry highlight
                </button>
              )}
              {story?.fileName &&
                (isVideoFile(story.fileName) ? (
                  <video
                    controls
                    playsInline
                    src={mediaUrl(story.fileName)!}
                    className="max-h-[55dvh] w-full"
                  />
                ) : (
                  <Image
                    unoptimized
                    src={mediaUrl(story.fileName)!}
                    width={480}
                    height={640}
                    alt={`Story in ${title}`}
                    className="max-h-[55dvh] w-full object-contain"
                  />
                ))}
              {stories.data?.length === 0 && <p>This highlight is empty.</p>}
              <div className="mt-3 flex justify-between">
                <Button
                  variant="secondary"
                  disabled={index <= 0}
                  onClick={() => setIndex((i) => i - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  disabled={index >= (stories.data?.length ?? 0) - 1}
                  onClick={() => setIndex((i) => i + 1)}
                >
                  Next
                </Button>
              </div>
              {isSelf && (
                <div className="mt-4 flex gap-3">
                  <Button
                    disabled={!stories.data}
                    onClick={() => {
                      setIds(stories.data?.map((s) => s.id) ?? []);
                      setEditing(true);
                    }}
                  >
                    Edit highlight
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={action.isPending}
                    onClick={() =>
                      confirm ? action.mutate("delete") : setConfirm(true)
                    }
                  >
                    {confirm ? "Confirm delete highlight" : "Delete highlight"}
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

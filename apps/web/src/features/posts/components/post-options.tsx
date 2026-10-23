"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMe } from "@/features/auth/hooks";
import { CollectionsBrowser } from "@/features/collections/components/collections-browser";
import { ReportDialog } from "@/features/social/components/report-dialog";
import {
  updatePost,
  archivePost,
  pinPost,
  deletePost,
} from "@/features/social/api";
import { usePost } from "../hooks";
import { toast } from "@/components/ui/toast";
export function PostOptions({
  postId,
  userId,
}: {
  postId: number;
  userId: string;
}) {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"menu" | "delete" | "edit" | "collections">(
    "menu",
  );
  const [report, setReport] = useState(false);
  const [content, setContent] = useState("");
  const [location, setLocation] = useState("");
  const post = usePost(postId, open);
  const action = useMutation({
    mutationFn: async (
      kind: "delete" | "archive" | "pin" | "likes" | "comments" | "edit",
    ) => {
      if (kind === "delete") return deletePost(postId);
      if (kind === "archive") return archivePost(postId);
      if (kind === "pin") return pinPost(postId);
      if (kind === "edit")
        return updatePost({
          postId,
          content,
          location: location.trim() || null,
        });
      if (!post.data)
        throw new Error("The post has not loaded. Please try again.");
      return updatePost({
        postId,
        ...(kind === "likes"
          ? { hideLikeCount: !post.data.hideLikeCount }
          : { commentsDisabled: !post.data.commentsDisabled }),
      });
    },
    onSuccess: (_, kind) => {
      setOpen(false);
      void qc.invalidateQueries();
      toast(kind === "delete" ? "Post deleted" : "Post updated");
    },
    onError: (error) => toast.error(error.message),
  });
  const row =
    "w-full border-b border-ig-separator p-4 text-center disabled:opacity-50";
  return (
    <>
      <button
        type="button"
        aria-label="More options"
        onClick={() => {
          setMode("menu");
          setOpen(true);
        }}
        className="rounded-lg p-1 hover:bg-ig-hover-overlay"
      >
        <MoreHorizontal className="size-5" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showClose={false}
          className={
            mode === "collections" ? "max-w-[600px] overflow-y-auto p-5" : ""
          }
        >
          <DialogTitle
            className={mode === "menu" ? "sr-only" : "px-6 pt-6 text-center"}
          >
            {mode === "delete"
              ? "Delete post?"
              : mode === "edit"
                ? "Edit post"
                : mode === "collections"
                  ? "Save post"
                  : "Post options"}
          </DialogTitle>
          <DialogDescription
            className={mode === "delete" ? "px-6 py-4 text-center" : "sr-only"}
          >
            {mode === "delete"
              ? "This post will be permanently removed."
              : "Actions for this post."}
          </DialogDescription>
          {mode === "delete" && (
            <Button
              variant="borderless"
              className={`${row} text-ig-error`}
              disabled={action.isPending}
              onClick={() => action.mutate("delete")}
            >
              Delete
            </Button>
          )}
          {mode === "edit" && (
            <form
              className="space-y-4 p-6"
              onSubmit={(e) => {
                e.preventDefault();
                action.mutate("edit");
              }}
            >
              <label className="block">
                Caption
                <textarea
                  aria-label="Edit caption"
                  value={content}
                  maxLength={2200}
                  onChange={(e) => setContent(e.target.value)}
                  className="mt-2 w-full rounded border border-ig-stroke bg-transparent p-3"
                />
              </label>
              <label className="block">
                Location
                <input
                  aria-label="Edit location"
                  value={location}
                  maxLength={100}
                  onChange={(e) => setLocation(e.target.value)}
                  className="mt-2 w-full rounded border border-ig-stroke bg-transparent p-3"
                />
              </label>
              <Button disabled={action.isPending} type="submit">
                Save changes
              </Button>
            </form>
          )}
          {mode === "collections" && (
            <CollectionsBrowser
              postId={postId}
              onSaved={() => setOpen(false)}
            />
          )}
          {mode === "menu" && (
            <>
              {me?.userId === userId && (
                <>
                  <button
                    className={row}
                    disabled={!post.data}
                    onClick={() => {
                      setContent(post.data?.content ?? "");
                      setLocation(post.data?.location ?? "");
                      setMode("edit");
                    }}
                  >
                    Edit post
                  </button>
                  <button
                    className={row}
                    disabled={action.isPending || !post.data}
                    onClick={() => action.mutate("archive")}
                  >
                    {post.data?.isArchived ? "Unarchive post" : "Archive post"}
                  </button>
                  <button
                    className={row}
                    disabled={action.isPending || !post.data}
                    onClick={() => action.mutate("pin")}
                  >
                    {post.data?.isPinned ? "Unpin post" : "Pin post"}
                  </button>
                  <button
                    className={row}
                    disabled={action.isPending || !post.data}
                    onClick={() => action.mutate("likes")}
                  >
                    {post.data?.hideLikeCount
                      ? "Show like count"
                      : "Hide like count"}
                  </button>
                  <button
                    className={row}
                    disabled={action.isPending || !post.data}
                    onClick={() => action.mutate("comments")}
                  >
                    {post.data?.commentsDisabled
                      ? "Turn on commenting"
                      : "Turn off commenting"}
                  </button>
                  <button
                    className={`${row} text-ig-error`}
                    onClick={() => setMode("delete")}
                  >
                    Delete
                  </button>
                </>
              )}
              {post.isError && (
                <button className={row} onClick={() => void post.refetch()}>
                  Retry post details
                </button>
              )}
              <button className={row} onClick={() => setMode("collections")}>
                Add to collection
              </button>
              <button
                className={`${row} text-ig-error`}
                onClick={() => {
                  setOpen(false);
                  setReport(true);
                }}
              >
                Report
              </button>
              <Link
                href={`/p/${postId}`}
                onClick={() => setOpen(false)}
                className={`block ${row}`}
              >
                Go to post
              </Link>
              <button
                className={row}
                onClick={() => {
                  void navigator.clipboard
                    .writeText(`${window.location.origin}/p/${postId}`)
                    .then(() => {
                      toast("Link copied");
                      setOpen(false);
                    })
                    .catch(() => toast.error("Could not copy link."));
                }}
              >
                Copy link
              </button>
            </>
          )}
          <button
            className="w-full p-4"
            onClick={() => {
              setOpen(false);
              setMode("menu");
            }}
          >
            Cancel
          </button>
        </DialogContent>
      </Dialog>
      <ReportDialog
        open={report}
        onClose={() => setReport(false)}
        targetType="POST"
        targetId={String(postId)}
      />
    </>
  );
}

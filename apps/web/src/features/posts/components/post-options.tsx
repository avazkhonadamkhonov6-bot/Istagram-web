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
import { api } from "@/lib/api-client";
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
  const [confirm, setConfirm] = useState(false);
  const remove = useMutation({
    mutationFn: () =>
      api(`/Post/delete-post?id=${postId}`, { method: "DELETE" }),
    onSuccess: () => {
      setOpen(false);
      void qc.invalidateQueries();
      toast("Post deleted");
    },
    onError: () => toast.error("Could not delete post. Try again."),
  });
  return (
    <>
      <button
        type="button"
        aria-label="More options"
        onClick={() => setOpen(true)}
        className="rounded-lg p-1 hover:bg-ig-hover-overlay"
      >
        <MoreHorizontal className="size-5" />
      </button>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          setConfirm(false);
        }}
      >
        <DialogContent showClose={false}>
          <DialogTitle
            className={confirm ? "px-6 pt-6 text-center" : "sr-only"}
          >
            {confirm ? "Delete post?" : "Post options"}
          </DialogTitle>
          <DialogDescription
            className={confirm ? "px-6 py-4 text-center" : "sr-only"}
          >
            {confirm
              ? "This post will be permanently removed."
              : "Actions for this post."}
          </DialogDescription>
          {me?.userId === userId && (
            <Button
              variant="borderless"
              className="w-full rounded-none border-b border-ig-separator py-6 text-ig-error"
              disabled={remove.isPending}
              onClick={() => {
                if (confirm) remove.mutate();
                else setConfirm(true);
              }}
            >
              {remove.isPending ? "Deleting…" : "Delete"}
            </Button>
          )}
          {!confirm && (
            <>
              <Link
                href={`/p/${postId}`}
                onClick={() => setOpen(false)}
                className="block border-b border-ig-separator p-4 text-center"
              >
                Go to post
              </Link>
              <button
                className="w-full border-b border-ig-separator p-4"
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
              setConfirm(false);
            }}
          >
            Cancel
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}

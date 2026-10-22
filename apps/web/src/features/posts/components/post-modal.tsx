"use client";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { ChevronLeft, X } from "@/components/ui/icons";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// Desktop post modal as on instagram.com: the dialog fills the viewport, the
// close button sits outside the card in the top-right corner, and a click on
// the dimmed area around the card closes it.
export function PostModal({ children }: { children: ReactNode }) {
  const router = useRouter();
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) router.back();
      }}
    >
      <DialogContent
        showClose={false}
        onClick={(e) => {
          if (e.target === e.currentTarget) router.back();
        }}
        className="inset-0 left-0 top-0 flex size-full max-h-none w-full max-w-none translate-x-0 translate-y-0 items-center justify-center overflow-visible rounded-none bg-transparent shadow-none md:px-16 md:py-6"
      >
        <DialogTitle className="sr-only">Post</DialogTitle>
        <DialogDescription className="sr-only">
          View the post and its comments.
        </DialogDescription>
        <DialogClose aria-label="Close" className="ig-post-modal-close hidden md:block">
          <X className="size-7" strokeWidth={2} />
        </DialogClose>
        <div className="ig-post-modal-card flex size-full flex-col overflow-hidden bg-ig-bg-elevated md:rounded-[4px]">
          <div className="flex h-11 shrink-0 items-center border-b border-ig-elevated-separator px-2 md:hidden">
            <DialogClose aria-label="Back" className="p-2">
              <ChevronLeft className="size-6" />
            </DialogClose>
            <span className="flex-1 text-center text-base font-semibold">Post</span>
            <span aria-hidden className="w-10" />
          </div>
          <div className="flex min-h-0 flex-1">{children}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

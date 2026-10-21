"use client";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
export function PostModal({ children }: { children: ReactNode }) {
  const router = useRouter();
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) router.back();
      }}
    >
      <DialogContent className="flex h-[min(90dvh,700px)] max-w-[1000px] overflow-y-auto">
        <DialogTitle className="sr-only">Post</DialogTitle>
        <DialogDescription className="sr-only">
          View the post and its comments.
        </DialogDescription>
        {children}
      </DialogContent>
    </Dialog>
  );
}

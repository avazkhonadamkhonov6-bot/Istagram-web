"use client";
import { ShareDialog } from "@/features/direct/components/share-dialog";

/** Share-i post / reel: hamon dialogi Direct (intixobi chand nafar, misli Instagram) */
export function SharePostDialog({
  postId,
  open,
  onOpenChange,
}: {
  postId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return <ShareDialog share={open ? { postId } : null} onClose={() => onOpenChange(false)} />;
}

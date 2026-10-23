"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UserProfile } from "@repo/shared";
import { MoreHorizontal } from "lucide-react";
import {
  getRelationStatus,
  relationAction,
  type RelationAction,
} from "@/features/social/api";
import { ReportDialog } from "@/features/social/components/report-dialog";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
export function ProfileActions({ profile }: { profile: UserProfile }) {
  const [open, setOpen] = useState(false);
  const [report, setReport] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const router = useRouter();
  const client = useQueryClient();
  const status = useQuery({
    queryKey: ["relation-status", profile.userId],
    queryFn: () => getRelationStatus(profile.userId),
    enabled: open,
  });
  const mutation = useMutation({
    mutationFn: (action: RelationAction) =>
      relationAction(action, profile.userId),
    onSuccess: (_, action) => {
      setOpen(false);
      setConfirm(false);
      void client.invalidateQueries();
      if (action === "block") router.push("/");
      toast("Account preferences updated");
    },
    onError: (error) => toast.error(error.message),
  });
  const values = status.data;
  const row = "w-full border-b border-ig-separator p-4 disabled:opacity-50";
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setConfirm(false);
          setOpen(true);
        }}
        aria-label="Profile options"
        className="p-2"
      >
        <MoreHorizontal />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showClose={false}>
          <DialogTitle className="px-5 pt-5">Account options</DialogTitle>
          <DialogDescription className="px-5 py-3">
            Manage your relationship with {profile.userName}.
          </DialogDescription>
          {status.isError && (
            <button className={row} onClick={() => void status.refetch()}>
              Retry account options
            </button>
          )}
          <button
            className={`${row} text-ig-error`}
            disabled={!values || mutation.isPending}
            onClick={() =>
              confirm ? mutation.mutate("block") : setConfirm(true)
            }
          >
            {confirm ? "Confirm block" : "Block"}
          </button>
          {(
            [
              [
                values?.isRestricted ? "Unrestrict" : "Restrict",
                values?.isRestricted ? "unrestrict" : "restrict",
              ],
              [
                values?.isMutedPosts || values?.isMutedStories
                  ? "Unmute"
                  : "Mute",
                values?.isMutedPosts || values?.isMutedStories
                  ? "unmute"
                  : "mute",
              ],
              [
                values?.isCloseFriend
                  ? "Remove close friend"
                  : "Add close friend",
                values?.isCloseFriend
                  ? "remove-close-friend"
                  : "add-close-friend",
              ],
              [
                values?.isFavorite ? "Remove favorite" : "Add favorite",
                values?.isFavorite ? "remove-favorite" : "add-favorite",
              ],
            ] as [string, RelationAction][]
          ).map(([label, action]) => (
            <button
              key={action}
              disabled={!values || mutation.isPending}
              className={row}
              onClick={() => mutation.mutate(action)}
            >
              {label}
            </button>
          ))}
          <button
            className={`${row} text-ig-error`}
            onClick={() => {
              setOpen(false);
              setReport(true);
            }}
          >
            Report account
          </button>
          <button className="w-full p-4" onClick={() => setOpen(false)}>
            Cancel
          </button>
        </DialogContent>
      </Dialog>
      <ReportDialog
        open={report}
        onClose={() => setReport(false)}
        targetType="USER"
        targetId={profile.userId}
      />
    </>
  );
}

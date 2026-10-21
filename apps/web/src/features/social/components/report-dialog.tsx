"use client";

import type { AddReportDto } from "@repo/shared";
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ChevronRight } from "@/components/ui/icons";
import { toast } from "@/components/ui/toast";
import { report } from "@/features/social/api";

/** Sababhoi report — misli Instagram */
const REASONS = [
  "I just don't like it",
  "Bullying or unwanted contact",
  "Suicide, self-injury or eating disorders",
  "Violence, hate or exploitation",
  "Selling or promoting restricted items",
  "Nudity or sexual activity",
  "Scam, fraud or spam",
  "False information",
];

export function ReportDialog({
  open,
  onClose,
  targetType,
  targetId,
}: {
  open: boolean;
  onClose: () => void;
  targetType: AddReportDto["targetType"];
  targetId: string;
}) {
  const [done, setDone] = useState(false);

  const send = async (reason: string) => {
    try {
      await report({ targetType, targetId, reason });
      setDone(true);
    } catch {
      toast.error("Couldn't send report");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          onClose();
          setDone(false);
        }
      }}
    >
      <DialogContent className="p-0">
        <DialogTitle className="border-b border-ig-separator py-3 text-center">Report</DialogTitle>
        {done ? (
          <div className="space-y-2 p-6 text-center">
            <p className="font-semibold">Thanks for letting us know</p>
            <p className="text-sm text-ig-text-secondary">Your feedback is important in helping us keep the community safe.</p>
          </div>
        ) : (
          <>
            <p className="px-4 pt-4 text-base font-semibold">Why are you reporting this?</p>
            <ul className="py-2">
              {REASONS.map((r) => (
                <li key={r}>
                  <button type="button" onClick={() => void send(r)} className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-ig-hover-overlay">
                    {r}
                    <ChevronRight className="size-4 text-ig-text-secondary" />
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

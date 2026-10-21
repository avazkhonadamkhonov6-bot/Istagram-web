"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;
export const SheetTitle = DialogPrimitive.Title;
export const SheetDescription = DialogPrimitive.Description;

type SheetContentProps = ComponentProps<typeof DialogPrimitive.Content> & {
  side?: "left" | "right";
};

/** Выдвижная панель 397px (Search / Notifications, Spec 10 §3) */
export function SheetContent({
  side = "left",
  className,
  children,
  ...props
}: SheetContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-40 animate-ig-fade bg-ig-overlay" />
      <DialogPrimitive.Content
        className={cn(
          "fixed top-0 z-50 h-full w-[397px] max-w-full bg-ig-bg-elevated text-ig-text shadow-ig-strong outline-none",
          side === "left"
            ? "left-0 animate-ig-slide-left rounded-r-2xl"
            : "right-0 animate-ig-slide-right rounded-l-2xl",
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
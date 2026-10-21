"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  title?: string;
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
  className?: string;
};

/** Xatoi fahmo + "Try again" (Spec 10 AC6) — baroi error.tsx va widget-ho */
export function ErrorFallback({
  title = "Something went wrong",
  message = "We couldn't load this. Check your connection and try again.",
  onRetry,
  compact,
  className,
}: Props) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-center",
        compact ? "px-4 py-6" : "min-h-[50vh] px-6 py-16",
        className,
      )}
    >
      <p className={cn("font-semibold text-ig-text", compact ? "text-sm" : "text-xl")}>{title}</p>
      {!compact && <p className="max-w-sm text-sm text-ig-text-secondary">{message}</p>}
      {onRetry && (
        <Button variant={compact ? "borderless" : "primary"} size={compact ? "link" : "md"} onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

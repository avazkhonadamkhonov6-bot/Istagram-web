import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-ig-shimmer rounded-md bg-linear-to-r from-ig-bg-secondary via-ig-bg-elevated-highlight to-ig-bg-secondary bg-[length:200%_100%]",
        className,
      )}
      {...props}
    />
  );
}
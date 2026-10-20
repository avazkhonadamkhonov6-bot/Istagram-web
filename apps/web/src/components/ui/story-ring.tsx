import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type StoryRingProps = {
  /** unseen: градиент, seen: серое кольцо, close-friends: зелёное */
  state?: "unseen" | "seen" | "close-friends";
  children: ReactNode;
  className?: string;
};

/** Avatar 56px внутри -> кольцо 66px (2px кольцо + 3px зазор) */
export function StoryRing({
  state = "unseen",
  children,
  className,
}: StoryRingProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full p-0.5",
        state === "unseen" && "bg-[image:var(--ig-brand-gradient)]",
        state === "seen" && "bg-ig-stroke",
        state === "close-friends" && "bg-ig-close-friends",
        className,
      )}
    >
      <span className="inline-flex rounded-full bg-ig-bg p-[3px]">
        {children}
      </span>
    </span>
  );
}
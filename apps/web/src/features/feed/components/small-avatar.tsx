import Image from "next/image";
import { cn } from "@/lib/utils";

export function SmallAvatar({
  src,
  name,
  className,
}: {
  src: string | null;
  name: string;
  className?: string;
}) {
  return src ? (
    <Image
      unoptimized
      width={150}
      height={150}
      src={src}
      alt={name}
      className={cn("size-8 rounded-full object-cover", className)}
    />
  ) : (
    <div
      aria-hidden
      className={cn(
        "ig-avatar-placeholder flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="size-full" focusable="false"><circle cx="12" cy="8.5" r="4.5" fill="currentColor" /><path d="M2 25v-2c0-5 4-8 10-8s10 3 10 8v2Z" fill="currentColor" /></svg>
    </div>
  );
}

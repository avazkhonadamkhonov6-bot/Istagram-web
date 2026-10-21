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
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      className={cn("size-8 rounded-full object-cover", className)}
    />
  ) : (
    <div
      aria-hidden
      className={cn(
        "flex size-8 items-center justify-center rounded-full bg-ig-bg-secondary text-xs font-semibold uppercase text-ig-text-secondary",
        className,
      )}
    >
      {name.slice(0, 1)}
    </div>
  );
}
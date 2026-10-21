import { cn } from "@/lib/utils";

export const AVATAR_SIZES = [24, 32, 44, 56, 77, 150] as const;
export type AvatarSize = (typeof AVATAR_SIZES)[number];

type AvatarProps = {
  src?: string | null;
  alt: string;
  size?: AvatarSize;
  className?: string;
};

export function Avatar({ src, alt, size = 44, className }: AvatarProps) {
  const style = { width: size, height: size };

  if (!src) {
    return (
      <span
        role="img"
        aria-label={alt}
        style={{ ...style, fontSize: Math.round(size * 0.4) }}
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full bg-ig-bg-secondary font-semibold uppercase text-ig-text-secondary",
          className,
        )}
      >
        {alt.charAt(0)}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      style={style}
      className={cn(
        "shrink-0 rounded-full border border-ig-stroke object-cover",
        className,
      )}
    />
  );
}
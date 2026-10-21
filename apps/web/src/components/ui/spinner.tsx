import { cn } from "@/lib/utils";

/** Спиннер Instagram: 12 серых лучей */
export function Spinner({
  size = 20,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      role="status"
      aria-label="Loading"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={cn("animate-ig-spinner text-ig-text-secondary", className)}
    >
      {Array.from({ length: 12 }, (_, i) => (
        <line
          key={i}
          x1="12"
          y1="2.5"
          x2="12"
          y2="7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeOpacity={Math.max(0.1, 1 - i * 0.08)}
          transform={`rotate(${i * 30} 12 12)`}
        />
      ))}
    </svg>
  );
}
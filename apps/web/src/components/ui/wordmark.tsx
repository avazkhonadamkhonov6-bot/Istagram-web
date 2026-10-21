import { cn } from "@/lib/utils";

/** Local vector wordmark; the CSS mask follows the current theme. */
export function Wordmark({ className }: { className?: string }) {
  return <span role="img" aria-label="Instagram" className={cn("ig-wordmark block h-[64px] w-[180px]", className)} />;
}

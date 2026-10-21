const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

/** 2m, 3h, 5d, 2w, а после 7 недель дата ("October 20") — Spec 10 §8 */
export function formatRelativeTime(
  input: Date | string | number,
  now: Date | string | number = Date.now(),
): string {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "";

  const diff = Math.max(
    0,
    Math.floor((new Date(now).getTime() - date.getTime()) / 1000),
  );

  if (diff < MINUTE) return "now";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h`;
  if (diff < WEEK) return `${Math.floor(diff / DAY)}d`;

  const weeks = Math.floor(diff / WEEK);
  if (weeks <= 7) return `${weeks}w`;

  const sameYear = date.getFullYear() === new Date(now).getFullYear();
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

function trimDecimal(value: number): string {
  // обрезаем (не округляем) до одного знака: 999 999 -> 999.9K, а не 1000K
  const truncated = Math.floor(value * 10) / 10;
  return Number.isInteger(truncated) ? String(truncated) : truncated.toFixed(1);
}

/** 1,234 / 12.5K / 1.2M / 3.4B — Spec 10 §8 */
export function formatCount(value: number): string {
  if (!Number.isFinite(value)) return "0";
  const n = Math.max(0, Math.floor(value));

  if (n < 10_000) return n.toLocaleString("en-US");
  if (n < 1_000_000) return `${trimDecimal(n / 1_000)}K`;
  if (n < 1_000_000_000) return `${trimDecimal(n / 1_000_000)}M`;
  return `${trimDecimal(n / 1_000_000_000)}B`;
}
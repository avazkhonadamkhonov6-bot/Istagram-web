"use client";

import { useId, type ComponentProps } from "react";

export function InstagramGlyph({ gradient, ...props }: ComponentProps<"svg"> & { gradient?: boolean }) {
  const id = useId();
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={gradient ? `url(#${id})` : "currentColor"} strokeWidth="2" aria-hidden="true" {...props}>
      {gradient && <defs><linearGradient id={id} x1="0" y1="1" x2=".6" y2="0"><stop stopColor="#FFD600" /><stop offset=".25" stopColor="#FF7A00" /><stop offset=".5" stopColor="#FF0069" /><stop offset=".75" stopColor="#D300C5" /><stop offset="1" stopColor="#7638FA" /></linearGradient></defs>}
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1.1" fill={gradient ? `url(#${id})` : "currentColor"} stroke="none" />
    </svg>
  );
}

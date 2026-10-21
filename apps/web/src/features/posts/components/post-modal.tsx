"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { X } from "@/components/ui/icons";

export function PostModal({ children }: { children: ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") router.back();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [router]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "var(--ig-modal-overlay)" }}
      onClick={() => router.back()}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={() => router.back()}
        className="absolute right-4 top-4 text-ig-text-on-media"
      >
        <X className="size-7" />
      </button>
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="flex h-[min(90vh,700px)] w-full max-w-[1000px] overflow-hidden rounded-xl bg-ig-bg-elevated"
      >
        {children}
      </div>
    </div>
  );
}
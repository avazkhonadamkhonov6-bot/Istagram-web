"use client";

import { useEffect } from "react";
import { ErrorFallback } from "@/components/error-fallback";

/** Xato dar segmenti (main) — sidebar memonad, faqat mazmun ivaz meshavad */
export default function MainError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return <ErrorFallback onRetry={retry} />;
}

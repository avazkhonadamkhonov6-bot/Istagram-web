"use client";

import { useEffect } from "react";
import { ErrorFallback } from "@/components/error-fallback";

export default function DirectError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return <ErrorFallback title="Couldn't load messages" onRetry={retry} />;
}

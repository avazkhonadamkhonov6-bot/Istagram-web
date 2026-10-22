"use client";

import { useSyncExternalStore } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api-client";

const unavailable = (error: unknown) => error instanceof ApiError && (error.status === 502 || error.status === 504);

export function BackendStatus() {
  const client = useQueryClient();
  const cache = client.getQueryCache();
  const failed = useSyncExternalStore(
    (notify) => cache.subscribe(notify),
    () => cache.getAll().some(q => q.getObserversCount() > 0 && unavailable(q.state.error ?? q.state.fetchFailureReason)),
    () => false,
  );
  if (!failed) return null;
  return <div role="status" className="ig-backend-status"><span>The server is taking too long to respond. Please try again in a moment.</span><button onClick={() => void client.refetchQueries({ type: "active", predicate: q => unavailable(q.state.error ?? q.state.fetchFailureReason) })}>Try again</button></div>;
}

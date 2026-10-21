"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { createContext, Suspense, useContext, useEffect, useState, type ReactNode } from "react";
import { CallLayer } from "@/features/rtc/components/call-layer";
import { initMocks } from "@/mocks/browser";
import { makeQueryClient } from "./query-client";

const mockingEnabled = process.env.NEXT_PUBLIC_API_MOCKING === "on";

// QueryProvider-i daruni (masalan, dar Direct) qabati zangro du bor namesozad
const NestedContext = createContext(false);

export function QueryProvider({ children }: { children: ReactNode }) {
  const nested = useContext(NestedContext);
  const [client] = useState(makeQueryClient);
  const [ready, setReady] = useState(!mockingEnabled);

  useEffect(() => {
    if (!mockingEnabled) return;
    initMocks()
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, []);

  if (!ready) return null;

  return (
    <QueryClientProvider client={client}>
      <NestedContext.Provider value>
        {children}
        {/* Zang va efir (Spec 16): dar har sahifa; dar rejimi mock — nest */}
        {!nested && !mockingEnabled && (
          <Suspense fallback={null}>
            <CallLayer />
          </Suspense>
        )}
      </NestedContext.Provider>
    </QueryClientProvider>
  );
}

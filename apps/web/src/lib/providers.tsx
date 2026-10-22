"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { createContext, Suspense, useContext, useEffect, useState, type ReactNode } from "react";
import { Spinner } from "@/components/ui/spinner";
import { CallLayer } from "@/features/rtc/components/call-layer";
import { useUiStore } from "@/store/ui.store";
import { initMocks } from "@/mocks/browser";
import { makeQueryClient } from "./query-client";

const mockingEnabled = process.env.NEXT_PUBLIC_API_MOCKING === "on";

// QueryProvider-i daruni (masalan, dar Direct) qabati zangro du bor namesozad
const NestedContext = createContext(false);

export function QueryProvider({ children }: { children: ReactNode }) {
  const nested = useContext(NestedContext);
  const [client] = useState(makeQueryClient);
  const [ready, setReady] = useState(!mockingEnabled);
  const [mockError, setMockError] = useState(false);

  useEffect(() => {
    if (!mockingEnabled) return;
    initMocks()
      .then(() => setReady(true))
      .catch(() => setMockError(true));
  }, []);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem("ig-theme");
    } catch {}
    useUiStore
      .getState()
      .setTheme(
        stored === "dark" || stored === "light"
          ? stored
          : "dark",
      );
  }, []);

  if (mockError)
    return (
      <div role="alert" className="p-8 text-center">
        Could not start preview data.{" "}
        <button
          onClick={() => window.location.reload()}
          className="text-ig-link-action"
        >
          Try again
        </button>
      </div>
    );

  if (!ready)
    return (
      <div
        className="grid min-h-dvh place-items-center"
        role="status"
        aria-label="Loading"
      >
        <Spinner />
      </div>
    );

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

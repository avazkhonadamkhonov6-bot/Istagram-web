import { Suspense } from "react";
import { LiveHostView } from "@/features/rtc/components/live-views";

// This authenticated screen renders per request; skip instant-navigation assertions.
export const instant = false;

export default function GoLivePage() {
  return (
    <Suspense fallback={null}>
      <LiveHostView />
    </Suspense>
  );
}

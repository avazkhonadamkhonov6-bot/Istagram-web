import { Suspense } from "react";
import { LiveHostView } from "@/features/rtc/components/live-views";

export default function GoLivePage() {
  return (
    <Suspense fallback={null}>
      <LiveHostView />
    </Suspense>
  );
}

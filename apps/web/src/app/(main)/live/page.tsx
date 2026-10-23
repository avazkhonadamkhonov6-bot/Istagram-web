import { Suspense } from "react";
import { LiveList } from "@/features/rtc/components/live-views";

// This authenticated screen renders per request; skip instant-navigation assertions.
export const instant = false;

export default function LivePage() {
  return (
    <Suspense fallback={null}>
      <LiveList />
    </Suspense>
  );
}

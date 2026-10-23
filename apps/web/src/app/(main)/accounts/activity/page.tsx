import { Suspense } from "react";
import { PrivacyNav, ActivityView } from "@/features/social/components/settings";

// This authenticated screen renders per request; skip instant-navigation assertions.
export const instant = false;

export default function ActivityPage() {
  return (
    <>
      <Suspense fallback={null}>
        <PrivacyNav />
      </Suspense>
      <ActivityView />
    </>
  );
}

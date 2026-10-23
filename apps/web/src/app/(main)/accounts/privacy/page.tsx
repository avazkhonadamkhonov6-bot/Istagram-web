import { Suspense } from "react";
import { PrivacyNav, PrivacySettings } from "@/features/social/components/settings";

// This authenticated screen renders per request; skip instant-navigation assertions.
export const instant = false;

export default function PrivacyPage() {
  return (
    <>
      <Suspense fallback={null}>
        <PrivacyNav />
      </Suspense>
      <PrivacySettings />
    </>
  );
}

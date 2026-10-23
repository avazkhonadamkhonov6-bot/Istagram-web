import { Suspense } from "react";
import { PrivacyNav, ArchiveView } from "@/features/social/components/settings";

// This authenticated screen renders per request; skip instant-navigation assertions.
export const instant = false;

export default function ArchivePage() {
  return (
    <>
      <Suspense fallback={null}>
        <PrivacyNav />
      </Suspense>
      <ArchiveView />
    </>
  );
}

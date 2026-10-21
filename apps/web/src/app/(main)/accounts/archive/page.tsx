import { Suspense } from "react";
import { PrivacyNav, ArchiveView } from "@/features/social/components/settings";

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

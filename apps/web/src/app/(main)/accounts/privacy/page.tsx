import { Suspense } from "react";
import { PrivacyNav, PrivacySettings } from "@/features/social/components/settings";

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

import { Suspense } from "react";
import { PrivacyNav, ActivityView } from "@/features/social/components/settings";

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

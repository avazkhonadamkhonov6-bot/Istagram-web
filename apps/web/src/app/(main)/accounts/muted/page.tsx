import { Suspense } from "react";
import { PrivacyNav, RelationListView } from "@/features/social/components/settings";

export default function MutedPage() {
  return (
    <>
      <Suspense fallback={null}>
        <PrivacyNav />
      </Suspense>
      <RelationListView kind="muted" />
    </>
  );
}

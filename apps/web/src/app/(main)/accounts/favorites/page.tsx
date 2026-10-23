import { Suspense } from "react";
import { PrivacyNav, RelationListView } from "@/features/social/components/settings";

// This authenticated screen renders per request; skip instant-navigation assertions.
export const instant = false;

export default function FavoritesPage() {
  return (
    <>
      <Suspense fallback={null}>
        <PrivacyNav />
      </Suspense>
      <RelationListView kind="favorites" />
    </>
  );
}

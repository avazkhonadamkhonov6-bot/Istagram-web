import { Suspense } from "react";
import { LocationView } from "@/features/social/components/location-view";

// This authenticated screen renders per request; skip instant-navigation assertions.
export const instant = false;

async function Content({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  return <LocationView name={decodeURIComponent(name)} />;
}

export default function LocationPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <Content params={params} />
    </Suspense>
  );
}

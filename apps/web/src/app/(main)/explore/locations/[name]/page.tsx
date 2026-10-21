import { Suspense } from "react";
import { LocationView } from "@/features/social/components/location-view";

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

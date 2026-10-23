import { Suspense } from "react";
import { getServerProfileData } from "@/lib/server-api";
import { ProfileView } from "@/features/profile/components/profile-view";

// This authenticated screen renders per request; skip instant-navigation assertions.
export const instant = false;
async function Content({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const initial = await getServerProfileData(username, "reels");
  return <ProfileView {...initial} username={username} initialTab="reels" />;
}
export default function Page({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <Content params={params} />
    </Suspense>
  );
}

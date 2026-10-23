import { Suspense } from "react";
import { getServerProfileData } from "@/lib/server-api";
import { ProfileView } from "@/features/profile/components/profile-view";
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

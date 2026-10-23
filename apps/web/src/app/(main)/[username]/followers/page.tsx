import { Suspense } from "react";
import { getServerProfileData } from "@/lib/server-api";
import { ProfileView } from "@/features/profile/components/profile-view";

async function Content({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const initial = await getServerProfileData(username);
  return (
    <ProfileView
      {...initial}
      username={decodeURIComponent(username)}
      modal="followers"
    />
  );
}

export default function FollowersPage({
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

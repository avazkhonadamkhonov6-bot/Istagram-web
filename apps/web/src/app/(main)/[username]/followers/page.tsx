import { Suspense } from "react";
import { getServerProfile } from "@/lib/server-api";
import { ProfileView } from "@/features/profile/components/profile-view";

async function Content({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const initialProfile = await getServerProfile(username);
  return (
    <ProfileView
      initialProfile={initialProfile}
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

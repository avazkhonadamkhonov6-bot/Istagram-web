import { Suspense } from "react";
import { ProfileView } from "@/features/profile/components/profile-view";

async function Content({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return <ProfileView username={decodeURIComponent(username)} modal="followers" />;
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
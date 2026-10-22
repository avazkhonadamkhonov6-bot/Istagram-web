import type { Metadata } from "next";
import { Suspense } from "react";
import { getServerProfile } from "@/lib/server-api";
import { ProfileView } from "@/features/profile/components/profile-view";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  const name = decodeURIComponent(username);
  return {
    title: { absolute: `@${name} • Instagram photos and videos` },
    description: `See Instagram photos and videos from @${name}.`,
    alternates: { canonical: `/${name}` },
    openGraph: { type: "profile", username: name, title: `@${name} • Instagram` },
  };
}

async function Content({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const initialProfile = await getServerProfile(username);
  return (
    <ProfileView
      initialProfile={initialProfile}
      username={decodeURIComponent(username)}
    />
  );
}

export default function ProfilePage({
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

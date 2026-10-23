import { Suspense } from "react";
import { StoryViewer } from "@/features/stories/components/story-viewer";

// This authenticated screen renders per request; skip instant-navigation assertions.
export const instant = false;
async function Content({params}: {params: Promise<{username: string}>}) {
  const {username} = await params;
  return <StoryViewer key={username} username={username} />;
}
export default function Page({params}: {params: Promise<{username: string}>}) {
  return <Suspense fallback={null}><Content params={params} /></Suspense>;
}

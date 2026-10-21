import { Suspense } from "react";
import { StoryViewer } from "@/features/stories/components/story-viewer";
async function Content({params}: {params: Promise<{username: string}>}) {
  const {username} = await params;
  return <StoryViewer key={username} username={username} />;
}
export default function Page({params}: {params: Promise<{username: string}>}) {
  return <Suspense fallback={null}><Content params={params} /></Suspense>;
}

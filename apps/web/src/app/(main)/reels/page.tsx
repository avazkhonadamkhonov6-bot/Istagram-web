import type { Metadata } from "next";
import { ReelsFeed } from "@/features/reels/components/reels-feed";

export const metadata: Metadata = { title: "Reels" };
export default function Page() { return <ReelsFeed />; }

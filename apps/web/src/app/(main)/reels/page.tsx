import type { Metadata } from "next";
import { ReelsFeed } from "@/features/reels/components/reels-feed";

// This authenticated screen renders per request; skip instant-navigation assertions.
export const instant = false;

export const metadata: Metadata = { title: "Reels" };
export default function Page() { return <ReelsFeed />; }

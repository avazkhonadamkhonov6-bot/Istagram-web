import { Suspense } from "react";
import { LiveList } from "@/features/rtc/components/live-views";

export default function LivePage() {
  return (
    <Suspense fallback={null}>
      <LiveList />
    </Suspense>
  );
}

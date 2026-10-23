import { Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";
import { LiveViewerView } from "@/features/rtc/components/live-views";

// This authenticated screen renders per request; skip instant-navigation assertions.
export const instant = false;

/** /live/[id] — tamoshoi efir. `params` faqat dar daxili <Suspense> (Next 16). */
export default function WatchLivePage({ params }: PageProps<"/live/[id]">) {
  return (
    <Suspense
      fallback={
        <div className="flex h-dvh items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <Watch params={params} />
    </Suspense>
  );
}

async function Watch({ params }: Pick<PageProps<"/live/[id]">, "params">) {
  const { id } = await params;
  const liveId = Number(id);
  if (!Number.isInteger(liveId) || liveId <= 0) {
    return <p className="m-auto p-8 text-center text-sm text-ig-text-secondary">Live video not found.</p>;
  }
  return <LiveViewerView key={liveId} liveId={liveId} />;
}

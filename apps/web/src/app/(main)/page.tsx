// This authenticated screen renders per request; skip instant-navigation assertions.
export const instant = false;

import { StoriesTray } from "@/features/stories/components/stories-tray";
import { WidgetBoundary } from "@/components/widget-boundary";
import { HomeFeed } from "@/features/feed/components/home-feed";
import { SuggestedSidebar } from "@/features/feed/components/suggested-sidebar";

export default function HomePage() {
  return (
    <div className="ig-home">
      <div className="ig-feed-column">
        <WidgetBoundary name="Stories">
          <StoriesTray />
        </WidgetBoundary>
        <HomeFeed />
      </div>
      <aside className="ig-suggestions">
        <WidgetBoundary name="Suggestions">
          <SuggestedSidebar />
        </WidgetBoundary>
      </aside>
    </div>
  );
}

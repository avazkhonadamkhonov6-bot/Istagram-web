import { StoriesTray } from "@/features/stories/components/stories-tray";
import { WidgetBoundary } from "@/components/widget-boundary";
import { Feed } from "@/features/feed/components/feed";
import { SuggestedSidebar } from "@/features/feed/components/suggested-sidebar";

export default function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-[1000px] justify-center gap-16 px-4 py-6 md:pt-8">
      <div className="w-full max-w-[470px]">
        <WidgetBoundary name="Stories">
          <StoriesTray />
        </WidgetBoundary>
        <Feed />
      </div>
      <aside className="hidden w-[319px] shrink-0 min-[1160px]:block">
        <WidgetBoundary name="Suggestions">
          <SuggestedSidebar />
        </WidgetBoundary>
      </aside>
    </div>
  );
}

import { ExploreSearch } from "@/features/explore/components/explore-search";
import { ExploreGrid } from "@/features/explore/components/explore-grid";

export default function ExplorePage() {
  return (
    <div className="ig-explore-page">
      <ExploreSearch />
      <ExploreGrid />
    </div>
  );
}
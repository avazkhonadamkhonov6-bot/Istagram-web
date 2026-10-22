"use client";

import { Search } from "lucide-react";
import { useUiStore } from "@/store/ui.store";

export function ExploreSearch() {
  const toggle = useUiStore((s) => s.togglePanel);
  return <button type="button" onClick={() => toggle("search")} className="ig-explore-search" aria-label="Search people and hashtags"><Search className="size-4" />Search</button>;
}

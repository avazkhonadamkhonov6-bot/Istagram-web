"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { useUiStore } from "@/store/ui.store";
import { NotificationsPanel } from "@/features/notifications/components/notifications-panel";
import { SearchPanel } from "@/features/search/components/search-panel";

const TITLES = { search: "Search", notifications: "Notifications" } as const;

export function SidePanel() {
  const panel = useUiStore((s) => s.panel);
  const closePanel = useUiStore((s) => s.closePanel);

  useEffect(() => {
    if (!panel) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePanel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panel, closePanel]);

  if (!panel) return null;

  return (
    <>
      {/* Прозрачная подложка: клик вне панели закрывает её */}
      <div aria-hidden className="fixed inset-0 z-20" onClick={closePanel} />
      <aside
        aria-label={TITLES[panel]}
        className="ig-side-panel fixed bottom-[50px] left-0 right-0 top-[60px] z-30 animate-ig-slide-left overflow-y-auto bg-ig-bg md:bottom-0 md:left-[72px] md:right-auto md:top-0 md:w-[397px] md:rounded-r-2xl md:border-r md:border-ig-separator md:shadow-ig-strong"
      >
        <button onClick={closePanel} aria-label="Close panel" className="absolute right-3 top-3 p-2 hover:opacity-60"><X className="size-5" /></button>
        <h2 className="px-6 pb-9 pt-3 text-2xl font-semibold">
          {TITLES[panel]}
        </h2>
        {panel === "search" ? <SearchPanel /> : <NotificationsPanel />}
      </aside>
    </>
  );
}

"use client";

import { useEffect } from "react";
import { useUiStore } from "@/store/ui.store";

const TITLES = { search: "Search", notifications: "Notifications" } as const;
const PLACEHOLDERS = {
  search: "Search will be built in FE-11.",
  notifications: "Notifications will be built in FE-12.",
} as const;

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
        className="fixed bottom-[50px] left-0 right-0 top-[60px] z-30 animate-ig-slide-left overflow-y-auto bg-ig-bg md:bottom-0 md:left-[72px] md:right-auto md:top-0 md:w-[397px] md:rounded-r-2xl md:border-r md:border-ig-separator md:shadow-ig-strong"
      >
        <h2 className="px-6 pb-9 pt-3 text-2xl font-semibold">
          {TITLES[panel]}
        </h2>
        <p className="px-6 text-sm text-ig-text-secondary">
          {PLACEHOLDERS[panel]}
        </p>
      </aside>
    </>
  );
}
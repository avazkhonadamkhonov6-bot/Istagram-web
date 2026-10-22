import { create } from "zustand";

export type SidePanel = "search" | "notifications" | null;
export type ThemeMode = "light" | "dark";
export type FeedMode = "following" | "favorites";

type UiState = {
  panel: SidePanel;
  createOpen: boolean;
  theme: ThemeMode;
  /** Feed-i sahifai asosi: tab-ho (desktop) va menyui "Instagram v" (mobil) */
  feedMode: FeedMode;
  setFeedMode: (mode: FeedMode) => void;
  togglePanel: (panel: Exclude<SidePanel, null>) => void;
  closePanel: () => void;
  setCreateOpen: (open: boolean) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
};

function applyThemeToDom(theme: ThemeMode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("light", "dark", "__ig-light-mode", "__ig-dark-mode");
  if (theme === "dark") {
    root.classList.add("dark", "__ig-dark-mode");
  } else {
    root.classList.add("light", "__ig-light-mode");
  }
  try {
    localStorage.setItem("ig-theme", theme);
  } catch {
    // ignore storage errors
  }
}

export const useUiStore = create<UiState>((set) => ({
  panel: null,
  createOpen: false,
  theme: "dark",
  feedMode: "following",
  setFeedMode: (feedMode) => set({ feedMode }),
  togglePanel: (panel) =>
    set((state) => ({ panel: state.panel === panel ? null : panel })),
  closePanel: () => set({ panel: null }),
  setCreateOpen: (createOpen) => set({ createOpen }),
  setTheme: (theme) => {
    applyThemeToDom(theme);
    set({ theme });
  },
  toggleTheme: () =>
    set((state) => {
      const next: ThemeMode = state.theme === "dark" ? "light" : "dark";
      applyThemeToDom(next);
      return { theme: next };
    }),
}));
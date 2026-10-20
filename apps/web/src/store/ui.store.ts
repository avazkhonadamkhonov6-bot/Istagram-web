import { create } from "zustand";

export type SidePanel = "search" | "notifications" | null;

type UiState = {
  panel: SidePanel;
  createOpen: boolean;
  togglePanel: (panel: Exclude<SidePanel, null>) => void;
  closePanel: () => void;
  setCreateOpen: (open: boolean) => void;
};

export const useUiStore = create<UiState>((set) => ({
  panel: null,
  createOpen: false,
  togglePanel: (panel) =>
    set((state) => ({ panel: state.panel === panel ? null : panel })),
  closePanel: () => set({ panel: null }),
  setCreateOpen: (createOpen) => set({ createOpen }),
}));
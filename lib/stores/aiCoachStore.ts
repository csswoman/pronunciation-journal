import { create } from "zustand";

const PANEL_DEFAULT_WIDTH = 380;

interface AICoachState {
  isOpen: boolean;
  isFullscreen: boolean;
  panelWidth: number;
  open: () => void;
  close: () => void;
  toggle: () => void;
  setFullscreen: (v: boolean) => void;
  setPanelWidth: (w: number) => void;
}

export const useAICoachStore = create<AICoachState>((set) => ({
  isOpen: false,
  isFullscreen: false,
  panelWidth: PANEL_DEFAULT_WIDTH,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false, isFullscreen: false }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  setFullscreen: (v) => set({ isFullscreen: v }),
  setPanelWidth: (w) => set({ panelWidth: w }),
}));

import { create } from "zustand";

const PANEL_DEFAULT_WIDTH = 380;

export type AICoachTab = "chat" | "interview" | "pronunciation";

export interface OpenCoachOptions {
  tab?: AICoachTab;
  prefill?: string;
}

interface AICoachState {
  isOpen: boolean;
  isFullscreen: boolean;
  panelWidth: number;
  /** Opciones consumidas al abrir el panel (p. ej. desde /ipa). */
  launch: OpenCoachOptions | null;
  open: () => void;
  openCoach: (options?: OpenCoachOptions) => void;
  consumeLaunch: () => OpenCoachOptions | null;
  close: () => void;
  toggle: () => void;
  setFullscreen: (v: boolean) => void;
  setPanelWidth: (w: number) => void;
}

export const useAICoachStore = create<AICoachState>((set, get) => ({
  isOpen: false,
  isFullscreen: false,
  panelWidth: PANEL_DEFAULT_WIDTH,
  launch: null,
  open: () => set({ isOpen: true }),
  openCoach: (options) =>
    set({
      isOpen: true,
      launch: options ?? { tab: "chat" },
    }),
  consumeLaunch: () => {
    const launch = get().launch;
    if (launch) set({ launch: null });
    return launch;
  },
  close: () => set({ isOpen: false, isFullscreen: false }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  setFullscreen: (v) => set({ isFullscreen: v }),
  setPanelWidth: (w) => set({ panelWidth: w }),
}));

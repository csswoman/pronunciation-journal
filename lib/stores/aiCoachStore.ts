import { create } from "zustand";
import type { MissionLaunch } from '@/lib/ai-practice/missions/launch'
import type { CoachLanguagePreference } from "@/lib/ai-practice/coach-language"

const PANEL_DEFAULT_WIDTH = 380;

export type AICoachTab = "chat" | "missions" | "pronunciation";

export interface OpenCoachOptions {
  tab?: AICoachTab;
  prefill?: string;
  mission?: MissionLaunch;
}

interface AICoachState {
  isOpen: boolean;
  isFullscreen: boolean;
  panelWidth: number;
  /** Opciones consumidas al abrir el panel (p. ej. desde /ipa). */
  launch: OpenCoachOptions | null;
  autoSpeak: boolean;
  /**
   * Explicit override for the language the coach replies in. `null` means
   * "follow my CEFR level", which is the default every session starts on —
   * the resolved value lives server-side, so this only ever carries a
   * deliberate learner choice.
   */
  coachLanguage: CoachLanguagePreference;
  open: () => void;
  openCoach: (options?: OpenCoachOptions) => void;
  consumeLaunch: () => OpenCoachOptions | null;
  close: () => void;
  toggle: () => void;
  setFullscreen: (v: boolean) => void;
  setPanelWidth: (w: number) => void;
  toggleAutoSpeak: () => void;
  setCoachLanguage: (v: CoachLanguagePreference) => void;
}

export const useAICoachStore = create<AICoachState>((set, get) => ({
  isOpen: false,
  isFullscreen: false,
  panelWidth: PANEL_DEFAULT_WIDTH,
  launch: null,
  autoSpeak: true,
  coachLanguage: null,
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
  toggleAutoSpeak: () => set((s) => ({ autoSpeak: !s.autoSpeak })),
  setCoachLanguage: (v) => set({ coachLanguage: v }),
}));

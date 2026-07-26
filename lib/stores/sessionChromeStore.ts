import { create } from "zustand";

/**
 * Ephemeral UI: when depth > 0, mobile BottomNav is hidden so practice
 * sessions reclaim vertical space. Depth allows nested session shells
 * (e.g. DailyStepSession wrapping PracticeSession) without flicker.
 */
interface SessionChromeState {
  depth: number;
  enterSession: () => void;
  exitSession: () => void;
}

export const useSessionChromeStore = create<SessionChromeState>((set) => ({
  depth: 0,
  enterSession: () => set((s) => ({ depth: s.depth + 1 })),
  exitSession: () => set((s) => ({ depth: Math.max(0, s.depth - 1) })),
}));

export function selectHideMobileNav(state: SessionChromeState): boolean {
  return state.depth > 0;
}

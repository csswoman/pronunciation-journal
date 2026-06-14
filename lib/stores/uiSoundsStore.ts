import { create } from 'zustand'

interface UISoundsState {
  soundEnabled: boolean
  setSoundEnabled: (enabled: boolean) => void
}

export const useUISoundsStore = create<UISoundsState>()((set) => ({
  soundEnabled: true,
  setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
}))

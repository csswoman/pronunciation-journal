import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** Largest gain multiplier applied on top of each cue recipe's baked gain. */
export const MAX_VOLUME_MULTIPLIER = 6

interface UISoundsState {
  soundEnabled: boolean
  /** 0–1 user preference; scaled by MAX_VOLUME_MULTIPLIER at playback. */
  volume: number
  setSoundEnabled: (enabled: boolean) => void
  setVolume: (volume: number) => void
}

function clampVolume(value: number): number {
  if (Number.isNaN(value)) return 0
  return Math.min(1, Math.max(0, value))
}

export const useUISoundsStore = create<UISoundsState>()(
  persist(
    (set) => ({
      soundEnabled: true,
      volume: 0.85,
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      setVolume: (volume) => set({ volume: clampVolume(volume) }),
    }),
    {
      name: 'ui-sounds',
      partialize: (state) => ({ soundEnabled: state.soundEnabled, volume: state.volume }),
    },
  ),
)

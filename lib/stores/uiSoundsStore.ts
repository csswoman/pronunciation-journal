import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type SoundPreference = 'off' | 'exercise' | 'ui' | 'all'

/** Largest gain multiplier applied on top of each cue recipe's baked gain. */
export const MAX_VOLUME_MULTIPLIER = 6

interface UISoundsState {
  soundPreference: SoundPreference
  /** Backward-compatible alias for soundPreference !== 'off' */
  soundEnabled: boolean
  /** 0–1 user preference; scaled by MAX_VOLUME_MULTIPLIER at playback. */
  volume: number
  setSoundPreference: (pref: SoundPreference) => void
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
      soundPreference: 'exercise',
      soundEnabled: true,
      volume: 0.85,
      setSoundPreference: (pref) =>
        set({ soundPreference: pref, soundEnabled: pref !== 'off' }),
      setSoundEnabled: (enabled) =>
        set({
          soundEnabled: enabled,
          soundPreference: enabled ? 'exercise' : 'off',
        }),
      setVolume: (volume) => set({ volume: clampVolume(volume) }),
    }),
    {
      name: 'ui-sounds',
      version: 1,
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as Partial<UISoundsState>
        if (version === 0 || !state?.soundPreference) {
          const enabled = state?.soundEnabled !== false
          return {
            ...state,
            soundPreference: enabled ? 'exercise' : 'off',
            soundEnabled: enabled,
          }
        }
        return state
      },
      partialize: (state) => ({
        soundPreference: state.soundPreference,
        soundEnabled: state.soundPreference !== 'off',
        volume: state.volume,
      }),
    },
  ),
)

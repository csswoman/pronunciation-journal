import { describe, it, expect, beforeEach } from 'vitest'
import { useUISoundsStore } from '../uiSoundsStore'

describe('uiSoundsStore', () => {
  beforeEach(() => {
    useUISoundsStore.setState({ soundEnabled: true, volume: 0.85 })
  })

  it('defaults soundEnabled to true', () => {
    expect(useUISoundsStore.getState().soundEnabled).toBe(true)
  })

  it('toggles soundEnabled', () => {
    useUISoundsStore.getState().setSoundEnabled(false)
    expect(useUISoundsStore.getState().soundEnabled).toBe(false)
  })

  it('sets volume', () => {
    useUISoundsStore.getState().setVolume(0.5)
    expect(useUISoundsStore.getState().volume).toBe(0.5)
  })

  it('clamps volume to the 0–1 range', () => {
    useUISoundsStore.getState().setVolume(2)
    expect(useUISoundsStore.getState().volume).toBe(1)
    useUISoundsStore.getState().setVolume(-1)
    expect(useUISoundsStore.getState().volume).toBe(0)
  })
})

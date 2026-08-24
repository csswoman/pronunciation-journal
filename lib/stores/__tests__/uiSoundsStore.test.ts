import { describe, it, expect, beforeEach } from 'vitest'
import { useUISoundsStore } from '../uiSoundsStore'

describe('uiSoundsStore', () => {
  beforeEach(() => {
    useUISoundsStore.setState({
      soundPreference: 'exercise',
      soundEnabled: true,
      volume: 0.85,
    })
  })

  it('defaults soundPreference to exercise for safety and continuity', () => {
    expect(useUISoundsStore.getState().soundPreference).toBe('exercise')
    expect(useUISoundsStore.getState().soundEnabled).toBe(true)
  })

  it('updates soundPreference correctly', () => {
    useUISoundsStore.getState().setSoundPreference('ui')
    expect(useUISoundsStore.getState().soundPreference).toBe('ui')
    expect(useUISoundsStore.getState().soundEnabled).toBe(true)

    useUISoundsStore.getState().setSoundPreference('off')
    expect(useUISoundsStore.getState().soundPreference).toBe('off')
    expect(useUISoundsStore.getState().soundEnabled).toBe(false)
  })

  it('supports legacy setSoundEnabled bridge', () => {
    useUISoundsStore.getState().setSoundEnabled(false)
    expect(useUISoundsStore.getState().soundPreference).toBe('off')
    expect(useUISoundsStore.getState().soundEnabled).toBe(false)

    useUISoundsStore.getState().setSoundEnabled(true)
    expect(useUISoundsStore.getState().soundPreference).toBe('exercise')
    expect(useUISoundsStore.getState().soundEnabled).toBe(true)
  })

  it('sets and clamps volume to the 0–1 range', () => {
    useUISoundsStore.getState().setVolume(0.5)
    expect(useUISoundsStore.getState().volume).toBe(0.5)

    useUISoundsStore.getState().setVolume(2)
    expect(useUISoundsStore.getState().volume).toBe(1)

    useUISoundsStore.getState().setVolume(-1)
    expect(useUISoundsStore.getState().volume).toBe(0)
  })
})

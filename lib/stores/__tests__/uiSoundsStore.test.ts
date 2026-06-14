import { describe, it, expect, beforeEach } from 'vitest'
import { useUISoundsStore } from '../uiSoundsStore'

describe('uiSoundsStore', () => {
  beforeEach(() => {
    useUISoundsStore.setState({ soundEnabled: true })
  })

  it('defaults soundEnabled to true', () => {
    expect(useUISoundsStore.getState().soundEnabled).toBe(true)
  })

  it('toggles soundEnabled', () => {
    useUISoundsStore.getState().setSoundEnabled(false)
    expect(useUISoundsStore.getState().soundEnabled).toBe(false)
  })
})

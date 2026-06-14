'use client'

import { useCallback, useRef } from 'react'
import { useUISoundsStore } from '@/lib/stores/uiSoundsStore'

function isReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function getOrCreateContext(ref: React.MutableRefObject<AudioContext | null>): AudioContext | null {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null
  if (!ref.current || ref.current.state === 'closed') {
    ref.current = new AudioContext()
  }
  return ref.current
}

function buildChain(ctx: AudioContext) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  const compressor = ctx.createDynamicsCompressor()
  osc.connect(gain)
  gain.connect(compressor)
  compressor.connect(ctx.destination)
  return { osc, gain }
}

function applyEnvelope(gain: GainNode, ctx: AudioContext, durationSec: number) {
  const now = ctx.currentTime
  const attack = 0.005
  const decay = 0.03
  const sustain = 0.3
  const release = 0.04

  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(1, now + attack)
  gain.gain.exponentialRampToValueAtTime(sustain, now + attack + decay)
  gain.gain.setValueAtTime(sustain, now + durationSec - release)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec)
}

export function useUISounds() {
  const ctxRef = useRef<AudioContext | null>(null)
  const soundEnabled = useUISoundsStore((s) => s.soundEnabled)

  const canPlay = useCallback(() => {
    return soundEnabled && !isReducedMotion()
  }, [soundEnabled])

  const playTap = useCallback(() => {
    if (!canPlay()) return
    const ctx = getOrCreateContext(ctxRef)
    if (!ctx) return

    const { osc, gain } = buildChain(ctx)
    const duration = 0.07
    osc.type = 'sine'
    osc.frequency.setValueAtTime(440, ctx.currentTime)
    applyEnvelope(gain, ctx, duration)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration)
  }, [canPlay])

  const playCorrect = useCallback(() => {
    if (!canPlay()) return
    const ctx = getOrCreateContext(ctxRef)
    if (!ctx) return

    const notes = [660, 880]
    const noteDuration = 0.1
    const gap = 0.02

    notes.forEach((freq, i) => {
      const startOffset = i * (noteDuration + gap)
      const { osc, gain } = buildChain(ctx)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startOffset)
      const now = ctx.currentTime + startOffset
      const attack = 0.005
      const decay = 0.03
      const sustain = 0.3
      const release = 0.04
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(1, now + attack)
      gain.gain.exponentialRampToValueAtTime(sustain, now + attack + decay)
      gain.gain.setValueAtTime(sustain, now + noteDuration - release)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + noteDuration)
      osc.start(ctx.currentTime + startOffset)
      osc.stop(ctx.currentTime + startOffset + noteDuration)
    })
  }, [canPlay])

  const playWrong = useCallback(() => {
    if (!canPlay()) return
    const ctx = getOrCreateContext(ctxRef)
    if (!ctx) return

    const { osc, gain } = buildChain(ctx)
    const duration = 0.12
    osc.type = 'sine'
    osc.frequency.setValueAtTime(300, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + duration)
    applyEnvelope(gain, ctx, duration)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration)
  }, [canPlay])

  return { playTap, playCorrect, playWrong }
}

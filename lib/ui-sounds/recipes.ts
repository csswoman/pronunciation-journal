import type { Recipe, ToneLayer } from './types'

/**
 * Helper to generate ascending or spaced tone sequences (arpeggios)
 * with proportional timing for progress cues (streak, milestone, level-up).
 */
export function arpeggio(
  base: number,
  ratios: number[],
  spacing: number,
  opts: {
    waveform?: OscillatorType
    attack?: number
    decay?: number
    peak?: number
  } = {},
): ToneLayer[] {
  const {
    waveform = 'sine',
    attack = 0.003,
    decay = 0.1,
    peak = 0.045,
  } = opts

  return ratios.map((ratio, i) => ({
    kind: 'tone' as const,
    waveform,
    frequency: Math.round(base * ratio * 100) / 100,
    offset: Number((i * spacing).toFixed(4)),
    attack,
    decay: decay + i * 0.01,
    peak: Math.max(0.01, peak - i * 0.003),
  }))
}

/** Curated recipe palette for product UI. */
export const RECIPES = {
  // === 9 Existing Cues (untouched, bit by bit) ===
  chime: {
    masterGain: 0.5,
    layers: [
      { kind: 'tone', waveform: 'sine', frequency: 1046.5, attack: 0.006, decay: 0.22, peak: 0.09 },
      { kind: 'tone', waveform: 'sine', frequency: 1568, offset: 0.09, attack: 0.006, decay: 0.26, peak: 0.08 },
    ],
    shimmer: { delay: 0.12, feedback: 0.25, wet: 0.18, lowpass: 4000 },
  },
  sparkle: {
    masterGain: 0.5,
    layers: [
      { kind: 'tone', waveform: 'sine', frequency: 1760, offset: 0, attack: 0.003, decay: 0.09, peak: 0.045 },
      { kind: 'tone', waveform: 'sine', frequency: 2217, offset: 0.045, attack: 0.003, decay: 0.09, peak: 0.04 },
      { kind: 'tone', waveform: 'sine', frequency: 2637, offset: 0.09, attack: 0.003, decay: 0.1, peak: 0.038 },
      { kind: 'tone', waveform: 'sine', frequency: 3520, offset: 0.135, attack: 0.003, decay: 0.12, peak: 0.032 },
    ],
    shimmer: { delay: 0.07, feedback: 0.35, wet: 0.22, lowpass: 6000 },
  },
  droplet: {
    masterGain: 0.55,
    layers: [
      { kind: 'tone', waveform: 'sine', frequency: 1200, glideTo: 550, glideTime: 0.14, attack: 0.004, decay: 0.2, peak: 0.075 },
    ],
    shimmer: { delay: 0.09, feedback: 0.2, wet: 0.15, lowpass: 3000 },
  },
  bloom: {
    masterGain: 0.5,
    layers: [
      { kind: 'tone', waveform: 'sine', frequency: 528, attack: 0.06, decay: 0.32, peak: 0.06 },
      { kind: 'tone', waveform: 'sine', frequency: 528, detune: 12, attack: 0.06, decay: 0.34, peak: 0.05 },
    ],
    shimmer: { delay: 0.15, feedback: 0.2, wet: 0.12, lowpass: 2500 },
  },
  whisper: {
    masterGain: 0.5,
    layers: [
      { kind: 'noise', filterType: 'lowpass', filterFrequency: 1200, filterQ: 0.7, attack: 0.04, decay: 0.16, peak: 0.05 },
    ],
  },
  tick: {
    masterGain: 0.4,
    layers: [
      { kind: 'noise', filterType: 'bandpass', filterFrequency: 5400, filterQ: 1.8, attack: 0.001, decay: 0.018, peak: 0.14 },
      { kind: 'tone', waveform: 'sine', frequency: 2600, attack: 0.001, decay: 0.012, peak: 0.018 },
    ],
  },
  press: {
    masterGain: 0.4,
    layers: [
      { kind: 'noise', filterType: 'bandpass', filterFrequency: 1700, filterQ: 1.4, attack: 0.001, decay: 0.02, peak: 0.13 },
    ],
  },
  release: {
    masterGain: 0.4,
    layers: [
      { kind: 'noise', filterType: 'bandpass', filterFrequency: 4600, filterQ: 1.8, attack: 0.001, decay: 0.016, peak: 0.12 },
      { kind: 'tone', waveform: 'sine', frequency: 3200, offset: 0.006, attack: 0.001, decay: 0.05, peak: 0.02 },
    ],
  },
  toggle: {
    masterGain: 0.4,
    layers: [
      { kind: 'noise', filterType: 'bandpass', filterFrequency: 2200, filterQ: 1.6, attack: 0.001, decay: 0.016, peak: 0.12 },
      { kind: 'noise', filterType: 'bandpass', filterFrequency: 3800, filterQ: 1.6, offset: 0.024, attack: 0.001, decay: 0.02, peak: 0.1 },
    ],
  },

  // === Family: Panel (subtle, no shimmer) ===
  'nav-open': {
    masterGain: 0.08,
    layers: [
      { kind: 'tone', waveform: 'sine', frequency: 380, glideTo: 580, glideTime: 0.07, attack: 0.002, decay: 0.08, peak: 0.07 },
    ],
  },
  'nav-close': {
    masterGain: 0.08,
    layers: [
      { kind: 'tone', waveform: 'sine', frequency: 580, glideTo: 380, glideTime: 0.07, attack: 0.002, decay: 0.08, peak: 0.07 },
    ],
  },

  // === Family: Transition ===
  'nav-switch': {
    masterGain: 0.08,
    layers: [
      { kind: 'noise', filterType: 'bandpass', filterFrequency: 3200, filterQ: 2.2, attack: 0.001, decay: 0.014, peak: 0.08 },
      { kind: 'tone', waveform: 'sine', frequency: 1800, attack: 0.001, decay: 0.016, peak: 0.02 },
    ],
  },

  // === Family: Positive Actions ===
  create: {
    masterGain: 0.22,
    layers: [
      { kind: 'tone', waveform: 'sine', frequency: 659.25, attack: 0.004, decay: 0.12, peak: 0.07 },
      { kind: 'tone', waveform: 'sine', frequency: 987.77, offset: 0.04, attack: 0.004, decay: 0.16, peak: 0.06 },
    ],
    shimmer: { delay: 0.08, feedback: 0.15, wet: 0.1, lowpass: 4500 },
  },
  save: {
    masterGain: 0.22,
    layers: [
      { kind: 'tone', waveform: 'sine', frequency: 523.25, attack: 0.004, decay: 0.14, peak: 0.07 },
      { kind: 'tone', waveform: 'sine', frequency: 783.99, offset: 0.035, attack: 0.004, decay: 0.16, peak: 0.06 },
    ],
    shimmer: { delay: 0.08, feedback: 0.12, wet: 0.08, lowpass: 4000 },
  },
  duplicate: {
    masterGain: 0.22,
    layers: [
      { kind: 'tone', waveform: 'sine', frequency: 523.25, attack: 0.003, decay: 0.08, peak: 0.06 },
      { kind: 'tone', waveform: 'sine', frequency: 659.25, offset: 0.03, attack: 0.003, decay: 0.08, peak: 0.06 },
      { kind: 'tone', waveform: 'sine', frequency: 1046.5, offset: 0.06, attack: 0.003, decay: 0.12, peak: 0.05 },
    ],
  },

  // === Family: Negative Actions ===
  delete: {
    masterGain: 0.2,
    layers: [
      { kind: 'tone', waveform: 'sine', frequency: 440, glideTo: 220, glideTime: 0.09, attack: 0.003, decay: 0.11, peak: 0.065 },
    ],
  },
  archive: {
    masterGain: 0.16,
    layers: [
      { kind: 'tone', waveform: 'sine', frequency: 392, glideTo: 293.66, glideTime: 0.06, attack: 0.003, decay: 0.08, peak: 0.05 },
    ],
  },

  // === Family: Progress (Ascending Arpeggios with Shimmer) ===
  streak: {
    masterGain: 0.35,
    layers: arpeggio(1046.5, [1, 1.25], 0.045, { attack: 0.003, decay: 0.12, peak: 0.06 }),
    shimmer: { delay: 0.08, feedback: 0.25, wet: 0.15, lowpass: 5000 },
  },
  milestone: {
    masterGain: 0.38,
    layers: arpeggio(1046.5, [1, 1.25, 1.5], 0.045, { attack: 0.003, decay: 0.14, peak: 0.06 }),
    shimmer: { delay: 0.09, feedback: 0.3, wet: 0.18, lowpass: 5500 },
  },
  'level-up': {
    masterGain: 0.4,
    layers: arpeggio(1046.5, [1, 1.25, 1.5, 2], 0.04, { attack: 0.003, decay: 0.16, peak: 0.06 }),
    shimmer: { delay: 0.1, feedback: 0.35, wet: 0.2, lowpass: 6000 },
  },

  // === Family: Chat ===
  'message-send': {
    masterGain: 0.2,
    layers: [
      { kind: 'tone', waveform: 'sine', frequency: 587.33, glideTo: 880, glideTime: 0.06, attack: 0.003, decay: 0.09, peak: 0.06 },
    ],
  },
  'message-receive': {
    masterGain: 0.2,
    layers: [
      { kind: 'tone', waveform: 'sine', frequency: 880, glideTo: 587.33, glideTime: 0.06, attack: 0.003, decay: 0.09, peak: 0.06 },
    ],
  },

  // === Family: Mechanical Keyboard ===
  'mech-key': {
    masterGain: 0.18,
    layers: [
      { kind: 'noise', filterType: 'bandpass', filterFrequency: 3800, filterQ: 3.5, attack: 0.001, decay: 0.012, peak: 0.22 },
      { kind: 'tone', waveform: 'triangle', frequency: 320, glideTo: 180, glideTime: 0.015, attack: 0.001, decay: 0.025, peak: 0.15 },
    ],
  },
  'mech-space': {
    masterGain: 0.22,
    layers: [
      { kind: 'noise', filterType: 'bandpass', filterFrequency: 2200, filterQ: 2.0, attack: 0.001, decay: 0.025, peak: 0.25 },
      { kind: 'tone', waveform: 'triangle', frequency: 220, glideTo: 110, glideTime: 0.025, attack: 0.001, decay: 0.04, peak: 0.18 },
    ],
  },
} as const satisfies Record<string, Recipe>

export type CueSound = keyof typeof RECIPES

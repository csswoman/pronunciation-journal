/**
 * Louder-by-default cue engine for exercise feedback.
 *
 * cuelume ships a subtle, fixed `masterGain` per recipe (~0.4–0.55) and
 * exposes no volume control, which makes the exercise feedback (correct /
 * wrong / tap) too quiet on many devices. We synthesize the same curated
 * recipes here on our own shared `AudioContext` so a single `VOLUME`
 * multiplier can lift every imperative cue without clipping.
 *
 * Only the imperative product cues live here. Ambient `data-cuelume-*`
 * button sounds stay on cuelume's `bind()` on purpose (they should remain
 * subtle).
 */

/** Relative loudness applied on top of each recipe's baked masterGain. */
const VOLUME = 3

const SOURCE_STOP_PADDING = 0.05
const CLEANUP_MARGIN = 0.05
const INAUDIBLE_GAIN = 0.001

interface ToneLayer {
  kind: 'tone'
  waveform: OscillatorType
  frequency: number
  attack: number
  decay: number
  peak: number
  offset?: number
  detune?: number
  glideTo?: number
  glideTime?: number
}

interface NoiseLayer {
  kind: 'noise'
  filterType: BiquadFilterType
  filterFrequency: number
  filterQ?: number
  attack: number
  decay: number
  peak: number
  offset?: number
}

type Layer = ToneLayer | NoiseLayer

interface Shimmer {
  delay: number
  feedback: number
  wet: number
  lowpass: number
}

interface Recipe {
  masterGain: number
  layers: Layer[]
  shimmer?: Shimmer
}

/** Curated subset used by product UI (mirrors cuelume recipes). */
const RECIPES = {
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
} as const satisfies Record<string, Recipe>

export type CueSound = keyof typeof RECIPES

function renderTone(context: AudioContext, destination: AudioNode, layer: ToneLayer, startTime: number): void {
  const oscillator = context.createOscillator()
  oscillator.type = layer.waveform
  oscillator.frequency.setValueAtTime(layer.frequency, startTime)
  if (layer.detune) oscillator.detune.value = layer.detune
  if (layer.glideTo !== undefined) {
    const glideTime = layer.glideTime ?? layer.attack + layer.decay
    oscillator.frequency.exponentialRampToValueAtTime(layer.glideTo, startTime + glideTime)
  }
  const gain = context.createGain()
  gain.gain.setValueAtTime(0.0001, startTime)
  gain.gain.exponentialRampToValueAtTime(layer.peak, startTime + layer.attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + layer.attack + layer.decay)
  oscillator.connect(gain).connect(destination)
  oscillator.start(startTime)
  oscillator.stop(startTime + layer.attack + layer.decay + SOURCE_STOP_PADDING)
}

function renderNoise(context: AudioContext, destination: AudioNode, layer: NoiseLayer, startTime: number): void {
  const duration = layer.attack + layer.decay + SOURCE_STOP_PADDING
  const length = Math.max(1, Math.floor(duration * context.sampleRate))
  const buffer = context.createBuffer(1, length, context.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) data[i] = 2 * Math.random() - 1
  const source = context.createBufferSource()
  source.buffer = buffer
  const filter = context.createBiquadFilter()
  filter.type = layer.filterType
  filter.frequency.value = layer.filterFrequency
  if (layer.filterQ !== undefined) filter.Q.value = layer.filterQ
  const gain = context.createGain()
  gain.gain.setValueAtTime(0.0001, startTime)
  gain.gain.exponentialRampToValueAtTime(layer.peak, startTime + layer.attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + layer.attack + layer.decay)
  source.connect(filter).connect(gain).connect(destination)
  source.start(startTime)
  source.stop(startTime + duration)
}

function attachShimmer(context: AudioContext, source: AudioNode, destination: AudioNode, shimmer: Shimmer): AudioNode[] {
  const delay = context.createDelay(1)
  delay.delayTime.value = shimmer.delay
  const feedbackFilter = context.createBiquadFilter()
  feedbackFilter.type = 'lowpass'
  feedbackFilter.frequency.value = shimmer.lowpass
  const feedbackGain = context.createGain()
  feedbackGain.gain.value = shimmer.feedback
  const wetGain = context.createGain()
  wetGain.gain.value = shimmer.wet
  source.connect(delay)
  delay.connect(feedbackFilter)
  feedbackFilter.connect(feedbackGain)
  feedbackGain.connect(delay)
  feedbackFilter.connect(wetGain)
  wetGain.connect(destination)
  return [delay, feedbackFilter, feedbackGain, wetGain]
}

function sourceEnd(recipe: Recipe): number {
  return Math.max(...recipe.layers.map((layer) => (layer.offset ?? 0) + layer.attack + layer.decay + SOURCE_STOP_PADDING))
}

function shimmerTail(shimmer: Shimmer | undefined): number {
  if (!shimmer || shimmer.feedback <= 0) return 0
  if (shimmer.feedback >= 1) return shimmer.delay
  return shimmer.delay * (1 + Math.ceil(Math.log(INAUDIBLE_GAIN) / Math.log(shimmer.feedback)))
}

function renderRecipe(context: AudioContext, recipe: Recipe): void {
  const now = context.currentTime
  const master = context.createGain()
  master.gain.value = recipe.masterGain * VOLUME
  master.connect(context.destination)
  const shimmerNodes = recipe.shimmer
    ? attachShimmer(context, master, context.destination, recipe.shimmer)
    : []
  for (const layer of recipe.layers) {
    const startTime = now + (layer.offset ?? 0)
    if (layer.kind === 'tone') renderTone(context, master, layer, startTime)
    else renderNoise(context, master, layer, startTime)
  }
  const cleanupAfterMs = (sourceEnd(recipe) + shimmerTail(recipe.shimmer) + CLEANUP_MARGIN) * 1000
  setTimeout(() => {
    master.disconnect()
    for (const node of shimmerNodes) node.disconnect()
  }, cleanupAfterMs)
}

let sharedContext: AudioContext | null = null
let enabled = true

/** Enables or disables future playback (mirrors app + a11y prefs). */
export function setEngineEnabled(value: boolean): void {
  enabled = value
}

function getAudioContext(): AudioContext | null {
  if (sharedContext) return sharedContext
  if (typeof window === 'undefined') return null
  // Safari exposes webkitAudioContext; typed here to avoid `any`.
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  try {
    sharedContext = new Ctor()
  } catch {
    return null
  }
  return sharedContext
}

/**
 * Plays a curated cue immediately at the boosted app volume. Lazily creates
 * the shared context, resumes it after a user gesture, and no-ops when Web
 * Audio is unavailable or playback is disabled.
 */
export function playCue(sound: CueSound): void {
  if (!enabled) return
  if (typeof navigator !== 'undefined' && navigator.userActivation?.hasBeenActive === false) return
  const context = getAudioContext()
  if (!context) return
  const recipe = RECIPES[sound]
  if (context.state === 'running') {
    renderRecipe(context, recipe)
    return
  }
  try {
    void context.resume().then(
      () => {
        if (enabled && context.state === 'running') renderRecipe(context, recipe)
      },
      () => {},
    )
  } catch {
    // Some browsers throw synchronously when audio is blocked.
  }
}

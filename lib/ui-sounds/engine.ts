/**
 * Louder-by-default cue engine with voice management and anti-click policies.
 *
 * Implements:
 * - 1 voice = 1 full cue (regardless of number of layers).
 * - Per-cue throttle (~100ms) to prevent audio clutter on rapid triggers.
 * - Global concurrency limit of 3 voices with oldest-voice stealing.
 * - Soft fade ramp (~10ms) and scheduled node termination on stealing/cleanup.
 * - Fail-soft behavior for blocked or unavailable Web Audio contexts.
 */
import { useUISoundsStore, MAX_VOLUME_MULTIPLIER } from '@/lib/stores/uiSoundsStore'
import { getAudioContext, resetAudioContextForTests } from './context'
import { RECIPES, type CueSound } from './recipes'
import type { NoiseLayer, Recipe, Shimmer, ToneLayer } from './types'

export { RECIPES, type CueSound }

const SOURCE_STOP_PADDING = 0.05
const CLEANUP_MARGIN = 0.05
const INAUDIBLE_GAIN = 0.001
const THROTTLE_MS = 100
const MAX_CONCURRENT_VOICES = 3
const FADE_OUT_DURATION = 0.01 // 10ms anti-click ramp

function currentVolume(): number {
  return useUISoundsStore.getState().volume * MAX_VOLUME_MULTIPLIER
}

interface ActiveVoice {
  id: number
  masterGain: GainNode
  stopTime: number
  timer: ReturnType<typeof setTimeout>
  nodes: AudioNode[]
}

let enabled = true
let nextVoiceId = 1
const activeVoices: ActiveVoice[] = []
const lastTriggerTimes = new Map<string, number>()

export function setEngineEnabled(value: boolean): void {
  enabled = value
}

export function resetEngineStateForTests(): void {
  resetAudioContextForTests()
  enabled = true
  nextVoiceId = 1
  activeVoices.length = 0
  lastTriggerTimes.clear()
}

export function getActiveVoiceCountForTests(): number {
  return activeVoices.length
}

function stopVoiceSoftly(context: AudioContext, voice: ActiveVoice): void {
  clearTimeout(voice.timer)
  const now = context.currentTime
  try {
    voice.masterGain.gain.cancelScheduledValues(now)
    voice.masterGain.gain.setValueAtTime(voice.masterGain.gain.value, now)
    voice.masterGain.gain.linearRampToValueAtTime(0.0001, now + FADE_OUT_DURATION)
  } catch {}

  // Stop scheduled sources to prevent future offset notes from firing
  for (const node of voice.nodes) {
    if ('stop' in node && typeof (node as AudioScheduledSourceNode).stop === 'function') {
      try {
        ;(node as AudioScheduledSourceNode).stop(now + FADE_OUT_DURATION)
      } catch {}
    }
  }

  setTimeout(() => {
    try {
      voice.masterGain.disconnect()
      for (const node of voice.nodes) node.disconnect()
    } catch {}
  }, (FADE_OUT_DURATION + 0.005) * 1000)
}

function renderTone(
  context: AudioContext,
  destination: AudioNode,
  layer: ToneLayer,
  startTime: number,
): AudioNode[] {
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
  return [oscillator, gain]
}

function renderNoise(
  context: AudioContext,
  destination: AudioNode,
  layer: NoiseLayer,
  startTime: number,
): AudioNode[] {
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
  return [source, filter, gain]
}

function attachShimmer(
  context: AudioContext,
  source: AudioNode,
  destination: AudioNode,
  shimmer: Shimmer,
): AudioNode[] {
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
  return Math.max(...recipe.layers.map((l) => (l.offset ?? 0) + l.attack + l.decay + SOURCE_STOP_PADDING))
}

function shimmerTail(shimmer: Shimmer | undefined): number {
  if (!shimmer || shimmer.feedback <= 0) return 0
  if (shimmer.feedback >= 1) return shimmer.delay
  return shimmer.delay * (1 + Math.ceil(Math.log(INAUDIBLE_GAIN) / Math.log(shimmer.feedback)))
}

function renderRecipe(context: AudioContext, recipe: Recipe): void {
  const now = context.currentTime
  for (let i = activeVoices.length - 1; i >= 0; i--) {
    if (activeVoices[i].stopTime <= now) {
      activeVoices.splice(i, 1)
    }
  }

  while (activeVoices.length >= MAX_CONCURRENT_VOICES) {
    const oldest = activeVoices.shift()
    if (oldest) stopVoiceSoftly(context, oldest)
  }

  const master = context.createGain()
  master.gain.value = recipe.masterGain * currentVolume()
  master.connect(context.destination)

  const shimmerNodes = recipe.shimmer
    ? attachShimmer(context, master, context.destination, recipe.shimmer)
    : []

  const renderedNodes: AudioNode[] = [...shimmerNodes]
  for (const layer of recipe.layers) {
    const startTime = now + (layer.offset ?? 0)
    const nodes = layer.kind === 'tone'
      ? renderTone(context, master, layer, startTime)
      : renderNoise(context, master, layer, startTime)
    renderedNodes.push(...nodes)
  }

  const totalDuration = sourceEnd(recipe) + shimmerTail(recipe.shimmer) + CLEANUP_MARGIN
  const voiceId = nextVoiceId++
  const timer = setTimeout(() => {
    try {
      master.disconnect()
      for (const node of renderedNodes) node.disconnect()
    } catch {}
    const idx = activeVoices.findIndex((v) => v.id === voiceId)
    if (idx !== -1) activeVoices.splice(idx, 1)
  }, totalDuration * 1000)

  activeVoices.push({
    id: voiceId,
    masterGain: master,
    stopTime: now + totalDuration,
    timer,
    nodes: renderedNodes,
  })
}

export function playCue(sound: CueSound): void {
  if (!enabled) return
  if (typeof navigator !== 'undefined' && navigator.userActivation?.hasBeenActive === false) return

  const nowMs = Date.now()
  const lastTime = lastTriggerTimes.get(sound) ?? 0
  if (nowMs - lastTime < THROTTLE_MS) return
  lastTriggerTimes.set(sound, nowMs)

  const context = getAudioContext()
  if (!context) return
  const recipe = RECIPES[sound]
  if (!recipe) return

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
  } catch {}
}

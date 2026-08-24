export interface ToneLayer {
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

export interface NoiseLayer {
  kind: 'noise'
  filterType: BiquadFilterType
  filterFrequency: number
  filterQ?: number
  attack: number
  decay: number
  peak: number
  offset?: number
}

export type Layer = ToneLayer | NoiseLayer

export interface Shimmer {
  delay: number
  feedback: number
  wet: number
  lowpass: number
}

export interface Recipe {
  masterGain: number
  layers: Layer[]
  shimmer?: Shimmer
}

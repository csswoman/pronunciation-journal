import type { CEFRLevel } from '@/lib/exercises/cefr'

export type ChunkExerciseStage = 'intent' | 'listening' | 'cloze' | 'reconstruction' | 'substitution' | 'microdialogue' | 'production'

export interface ChunkCefrSupport {
  stages: readonly ChunkExerciseStage[]
  allowFullDictation: boolean
  visibleModel: boolean
  responseFreedom: 'formulaic' | 'substitution' | 'guided' | 'open'
}

const CHUNK_CEFR_SUPPORT: Record<CEFRLevel, ChunkCefrSupport> = {
  A1: { stages: ['intent', 'listening', 'cloze', 'production'], allowFullDictation: false, visibleModel: true, responseFreedom: 'formulaic' },
  A2: { stages: ['intent', 'listening', 'cloze', 'substitution', 'production'], allowFullDictation: false, visibleModel: true, responseFreedom: 'substitution' },
  B1: { stages: ['intent', 'listening', 'cloze', 'reconstruction', 'substitution', 'microdialogue', 'production'], allowFullDictation: false, visibleModel: false, responseFreedom: 'guided' },
  B2: { stages: ['listening', 'cloze', 'reconstruction', 'substitution', 'microdialogue', 'production'], allowFullDictation: true, visibleModel: false, responseFreedom: 'open' },
  C1: { stages: ['listening', 'reconstruction', 'substitution', 'microdialogue', 'production'], allowFullDictation: true, visibleModel: false, responseFreedom: 'open' },
  C2: { stages: ['listening', 'reconstruction', 'substitution', 'microdialogue', 'production'], allowFullDictation: true, visibleModel: false, responseFreedom: 'open' },
}

export function chunkCefrSupport(level: CEFRLevel): ChunkCefrSupport {
  return CHUNK_CEFR_SUPPORT[level]
}

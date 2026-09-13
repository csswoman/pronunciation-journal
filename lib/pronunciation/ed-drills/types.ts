export type EdAllophone = 't' | 'd' | 'id'

export type EdCluster =
  | 'vd'
  | 'zd'
  | 'bd'
  | 'gd'
  | 'md'
  | 'nd'
  | 'ld'
  | 'kt'
  | 'pt'
  | 'ft'
  | 'st'
  | 'ʃt'
  | 'tʃt'
  | 't-id'
  | 'd-id'

export type EdEnvironment = 1 | 2 | 3

export interface EdDrillEnvironmentVariant {
  level: EdEnvironment
  environmentType: 'before_vowel' | 'pre_pausal' | 'before_consonant'
  sentence: string
  contrastSentence: string
  syllabified: string
  ipa: string
  targetChunk: string
}

export interface EdDrillItem {
  id: string
  baseVerb: string
  pastVerb: string
  allophone: EdAllophone
  cluster: EdCluster
  baseIpa: string
  pastIpa: string
  environments: Record<EdEnvironment, EdDrillEnvironmentVariant>
}

export interface UserEdClusterProgress {
  id: string
  userId: string
  cluster: EdCluster
  allophone: EdAllophone
  attemptsCount: number
  accuracy: number
  unlockedLevel: EdEnvironment
  epenthesisWarningsCount: number
  lastPracticedAt: string
}

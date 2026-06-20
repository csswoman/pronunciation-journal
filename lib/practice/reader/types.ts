import type { CEFRLevel } from '@/lib/exercises/cefr'

export interface ReaderQuestion {
  prompt: string
  options: string[]
  /** Index into `options` of the correct answer. */
  correctIndex: number
}

export interface ReaderPassage {
  id: string
  userId: string
  targetItems: string[]
  /** Namespaced SRS ids parallel to targetItems (e.g. `c1k:go`, `wb:<uuid>`, `fragment:<id>`). Drives exposure writes. */
  targetSrsIds: string[]
  targetHash: string
  topic: string
  passage: string
  questions: ReaderQuestion[]
  level: CEFRLevel
  createdAt: string
}

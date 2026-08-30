export type JournalStatus = 'draft' | 'submitted' | 'corrected'
/** Which writing UI produced/should reopen this entry — guided template fill-ins, free blank-page editor, or pronunciation journal. */
export type JournalEntryMode = 'guided' | 'blank' | 'pronunciation'

export type PronunciationDifficultyReason =
  | 'difficult_sound'
  | 'syllable_stress'
  | 'tricky_spelling'
  | 'new_word'
  | 'other'

export interface PronunciationItem {
  id: string
  wordOrPhrase: string
  ipa?: string
  syllableStress?: string
  difficultyReason: PronunciationDifficultyReason
  userNotes?: string
  practiceCount?: number
  audioUrl?: string
}

export interface PronunciationJournalPayload {
  items: PronunciationItem[]
}

export interface JournalEntryRecord {
  id: string
  userId: string
  entryDate: string
  prompt: string
  promptTopic?: string
  entryMode?: JournalEntryMode
  content: string
  status: JournalStatus
  correctedContent?: string
  feedback?: unknown
  createdAt: string
  updatedAt: string
}


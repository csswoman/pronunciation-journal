export type JournalStatus = 'draft' | 'submitted' | 'corrected'
export interface JournalEntryRecord { id: string; userId: string; entryDate: string; prompt: string; promptTopic?: string; content: string; status: JournalStatus; correctedContent?: string; feedback?: unknown; createdAt: string; updatedAt: string }

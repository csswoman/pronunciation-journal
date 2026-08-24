export type JournalStatus = 'draft' | 'submitted' | 'corrected'
/** Which writing UI produced/should reopen this entry — guided template fill-ins vs. free blank-page editor. */
export type JournalEntryMode = 'guided' | 'blank'
export interface JournalEntryRecord { id: string; userId: string; entryDate: string; prompt: string; promptTopic?: string; entryMode?: JournalEntryMode; content: string; status: JournalStatus; correctedContent?: string; feedback?: unknown; createdAt: string; updatedAt: string }

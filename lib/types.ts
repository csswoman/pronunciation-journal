export type Difficulty = "easy" | "medium" | "hard";

export interface Definition {
  definition: string;
  example?: string;
  synonyms?: string[];
  antonyms?: string[];
}

export interface Meaning {
  partOfSpeech: string;
  definitions: Definition[];
}

export interface Entry {
  id: string; // uuid
  word: string;
  ipa?: string;
  audioUrl?: string; // dictionary audio
  userAudioUrl?: string; // local blob URL or storage path
  notes?: string;
  difficulty: Difficulty;
  tags?: string[];
  meanings?: Meaning[]; // meanings from dictionary API
  createdAt: string;
  updatedAt?: string;
}

// ── Pronunciation Lesson Types ──

export interface LessonWord {
  word: string;
  ipa: string;
  audioUrl?: string; // reference pronunciation URL
  hint?: string; // pronunciation tip
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  category: string; // "basics", "common-words", "difficult-sounds"
  words: LessonWord[];
  difficulty: Difficulty;
  href?: string; // override link (e.g. for phoneme practice exercises)
  exerciseCount?: number; // shown instead of word count when words is empty
}

// ── Scoring Types ──

export type WordStatus = "correct" | "incorrect" | "missing" | "extra";

export interface PhonemeAlignment {
  phoneme: string;                              // ARPAbet symbol (no stress digit)
  ipa?: string;                                 // IPA symbol for this phoneme
  status: "correct" | "incorrect" | "missing";  // "missing" = expected but not heard
  got?: string;                                 // what was heard (only for "incorrect")
  gotIpa?: string;                              // IPA symbol for what was heard
}

export interface PhonemeResult {
  expected: string[];
  got: string[];
  tip: string | null;
  alignment: PhonemeAlignment[];
}

export interface WordResult {
  expected: string;
  got: string;
  status: WordStatus;
  phonemes?: PhonemeResult; // only present for status === "incorrect"
}

export interface ScoringResult {
  accuracy: number; // 0-100
  isCorrect: boolean; // accuracy >= threshold
  transcript: string; // raw STT output
  wordResults: WordResult[];
}

// ── Favorites Types ──

export interface FavoriteWord {
  id?: number;
  userId?: string;
  word: string;
  lessonId: string;
  ipa?: string;
  addedAt: string; // ISO date string
}


// ── SRS Types ──

export type SrsStatus = "active" | "snoozed" | "mastered";
export type FsrsCardState = "New" | "Learning" | "Review" | "Relearning";

export interface SRSData {
  userId?: string;
  wordId: string;
  word: string;
  ease: number; // easiness factor (default 2.5)
  interval: number; // days until next review
  repetitions: number; // consecutive correct answers
  nextReview: string; // ISO date string
  lastReview?: string;
  /** Vault/schedule state. Missing ≡ active. */
  status?: SrsStatus;
  snoozedAt?: string;
  masteredAt?: string;
  /** @deprecated Prefer status=snoozed. Kept for migration. */
  archived?: boolean;
  archivedAt?: string; // ISO
  /**
   * Passive reader-exposure signal, owned exclusively by recordReaderExposure.
   * Structurally separate from the SM-2 recall fields above so updateSRS never
   * touches it. The scheduler ignores this when choosing what to review.
   */
  exposure?: { lastAt: number; count: number };
  /**
   * FSRS fields (Fase C, spec §3). Additive and optional so readers that only
   * use the existing SM-2 fields remain compatible with legacy rows.
   */
  stability?: number;
  difficulty?: number;
  /** FSRS card state per ts-fsrs's model. */
  state?: FsrsCardState;
  /** Real reviews since migration; absent on cards never touched by FSRS. */
  fsrsRealReviews?: number;
}

// ── Attempt / Progress Types ──

export interface Attempt {
  id?: number; // auto-increment
  userId?: string;
  word: string;
  lessonId: string;
  transcript: string;
  accuracy: number;
  isCorrect: boolean;
  audioBlob?: Blob;
  timestamp: string; // ISO date string
}

export interface DailyProgress {
  id?: number;
  userId?: string;
  date: string; // YYYY-MM-DD
  totalAttempts: number;
  correctAttempts: number;
  averageAccuracy: number;
  xp: number;
  wordsStudied: string[];
  /** Palabras del Core 1000 introducidas hoy (cupo diario de nuevas). */
  core1000NewWords?: string[];
}

export interface UserStats {
  id?: number; // auto-increment (Dexie)
  userId?: string;
  currentStreak: number;
  longestStreak: number;
  totalXP: number;
  totalWords: number;
  totalAttempts: number;
  averageAccuracy: number;
  lastStudyDate: string;
  totalDecks?: number;
  totalDeckWords?: number;
  deckWordsDueToday?: number;
}

// ── AI Practice Types ──

export type AITemplateId =
  | "practice-questions"
  | "sentence-correction"
  | "personalized-practice"
  | "free-conversation";

export interface AIMessage {
  role: "user" | "model";
  content: string;
  timestamp: string; // ISO
}

export type AIConversationMode =
  | "chat"
  | `mission:${string}`
  | "pronunciation"
  | "lesson";

export interface AIConversation {
  id?: number;
  /** Owner of this private, offline-first conversation. */
  userId: string;
  templateId: AITemplateId | "custom";
  mode: AIConversationMode;
  title: string; // first 60 chars of first user message
  messages: AIMessage[];
  deviceId: string;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
}

// ── AI Learning Session (structured workspace) ──

export type StepExerciseFormat = "fill_blank" | "multiple_choice" | "speaking" | "checklist";

export type LearningStep =
  | { type: "explanation"; content: string }
  | {
      type: "exercise";
      format: "fill_blank";
      data: { sentence: string; answer: string; hint?: string };
    }
  | {
      type: "exercise";
      format: "multiple_choice";
      data: { question: string; options: string[]; correct: number };
    }
  | {
      type: "exercise";
      format: "speaking";
      data: { prompt: string; target: string };
    }
  | {
      type: "exercise";
      format: "checklist";
      data: { items: string[] };
    }
  | { type: "checklist"; items: string[] };

export interface LearningSession {
  title: string;
  summary: string; // short AI message shown in chat
  steps: LearningStep[];
}

export type TemplateVars =
  | { templateId: "practice-questions"; topic: string; userLevel: string }
  | { templateId: "sentence-correction"; sentence: string }
  | { templateId: "personalized-practice" }
  | { templateId: "free-conversation"; topic: string };

// ── Whisper Worker Messages ──

export interface WhisperWorkerRequest {
  type: "load" | "transcribe";
  /** Raw encoded audio (webm, ogg, etc.) — decoded inside the worker */
  buffer?: ArrayBuffer;
}

export interface WhisperWorkerResponse {
  type: "ready" | "result" | "error" | "progress";
  text?: string;
  error?: string;
  progress?: number;
}

// ── User Profile Types ──

export type AccentType = "american" | "british" | "neutral";

export interface UserPreferences {
  id?: string;
  user_id: string;
  full_name?: string;
  avatar_url?: string;
  accent: AccentType;
  theme_mode: "light" | "dark" | "auto";
  accent_color: string; // theme name: "blue" | "pink" | "purple" | "green" | "yellow" | "red" | "orange" | "neutral"
  created_at?: string;
  updated_at?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
  preferences?: UserPreferences;
}

// ── Word Bank Types ──
// Moved to lib/word-bank/types.ts (feature-scoped). Import from there.

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
}

// ── Scoring Types ──

export type WordStatus = "correct" | "incorrect" | "missing" | "extra";

export interface PhonemeAlignment {
  phoneme: string;                              // ARPAbet symbol (no stress digit)
  status: "correct" | "incorrect" | "missing";  // "missing" = expected but not heard
  got?: string;                                 // what was heard (only for "incorrect")
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
  word: string;
  lessonId: string;
  ipa?: string;
  addedAt: string; // ISO date string
}

export interface NeedsPracticeWord {
  word: string;
  lessonId: string;
  bestAccuracy: number;
  attempts: number;
}

// ── SRS Types ──

export interface SRSData {
  wordId: string;
  word: string;
  ease: number; // easiness factor (default 2.5)
  interval: number; // days until next review
  repetitions: number; // consecutive correct answers
  nextReview: string; // ISO date string
  lastReview?: string;
}

// ── Attempt / Progress Types ──

export interface Attempt {
  id?: number; // auto-increment
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
  date: string; // YYYY-MM-DD
  totalAttempts: number;
  correctAttempts: number;
  averageAccuracy: number;
  xp: number;
  wordsStudied: string[];
}

export interface UserStats {
  id?: number; // auto-increment (Dexie)
  currentStreak: number;
  longestStreak: number;
  totalXP: number;
  totalWords: number;
  totalAttempts: number;
  averageAccuracy: number;
  lastStudyDate: string;
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

export interface AIConversation {
  id?: number;
  templateId: AITemplateId | "custom";
  title: string; // first 60 chars of first user message
  messages: AIMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface AISavedWord {
  id?: number;
  word: string;
  meaning: string;
  difficulty: Difficulty;
  context: string; // sentence the word appeared in
  conversationId: number;
  savedAt: string;
}

export type TemplateVars =
  | { templateId: "practice-questions"; topic: string; userLevel: string }
  | { templateId: "sentence-correction"; sentence: string }
  | { templateId: "personalized-practice" }
  | { templateId: "free-conversation"; topic: string };

// ── Whisper Worker Messages ──

export interface WhisperWorkerRequest {
  type: "load" | "transcribe";
  audio?: Float32Array;
}

export interface WhisperWorkerResponse {
  type: "ready" | "result" | "error" | "progress";
  text?: string;
  error?: string;
  progress?: number;
}

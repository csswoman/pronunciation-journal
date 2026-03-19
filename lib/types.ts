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

export interface WordResult {
  expected: string;
  got: string;
  status: WordStatus;
}

export interface ScoringResult {
  accuracy: number; // 0-100
  isCorrect: boolean; // accuracy >= threshold
  transcript: string; // raw Whisper output
  wordResults: WordResult[];
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

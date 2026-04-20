export interface Sound {
  id: number;
  ipa: string;
  type: "vowel" | "consonant" | "diphthong";
  category: string | null;
  example: string | null;
  difficulty: number | null;
}

export interface Word {
  id: number;
  word: string;
  ipa: string | null;
  sound_id: number | null;
  difficulty: number | null;
  audio_url: string | null;
  sound_focus: string | null;
}

export interface Pattern {
  id: number;
  pattern: string;
  type: string | null;
  sound_focus: string | null;
}

export interface PatternWord {
  id: number;
  pattern_id: number;
  word: string;
  ipa: string | null;
}

export interface MinimalPair {
  id: number;
  word_a: string | null;
  word_b: string | null;
  ipa_a: string | null;
  ipa_b: string | null;
  sound_group: string | null;
  sound_a_id: number | null;
  sound_b_id: number | null;
  contrast_sound_a_id: number | null;
  contrast_sound_b_id: number | null;
  contrast_ipa_a: string | null;
  contrast_ipa_b: string | null;
}

export type Tab = "sounds" | "words" | "patterns" | "minimal_pairs";

export const TAB_LABEL: Record<Tab, string> = {
  sounds: "Sounds",
  words: "Words",
  patterns: "Patterns",
  minimal_pairs: "Minimal Pairs",
};

export interface SoundForm {
  ipa: string;
  type: string;
  category: string;
  example: string;
  difficulty: string;
}

export interface WordForm {
  word: string;
  ipa: string;
  soundId: string;
  soundFocus: string;
  difficulty: string;
}

export interface PatternForm {
  pattern: string;
  type: string;
  focus: string;
}

export interface PatternWordForm {
  patternId: string;
  word: string;
  ipa: string;
}

export interface MinimalPairForm {
  wordA: string;
  wordB: string;
  ipaA: string;
  ipaB: string;
  soundGroup: string;
  soundAId: string;
  soundBId: string;
  contrastAId: string;
  contrastBId: string;
  contrastIpaA: string;
  contrastIpaB: string;
}

export interface ChatMessage {
  role: "user" | "model";
  content: string;
}

export type ApplyPayload =
  | { tab: "sounds"; data: Partial<SoundForm> }
  | { tab: "words"; data: Partial<WordForm> }
  | { tab: "patterns"; data: Partial<PatternForm> }
  | { tab: "pattern_words"; data: Partial<PatternWordForm> }
  | { tab: "minimal_pairs"; data: Partial<MinimalPairForm> };

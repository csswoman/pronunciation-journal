export type Difficulty = "easy" | "medium" | "hard";

export interface Entry {
  id: string; // uuid
  word: string;
  ipa?: string;
  audioUrl?: string; // dictionary audio
  userAudioUrl?: string; // local blob URL or storage path
  notes?: string;
  difficulty: Difficulty;
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
}


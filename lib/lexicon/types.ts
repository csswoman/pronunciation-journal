export type LexiconDomainId = "engineering" | "design" | "professional" | "leisure";

export type CategoryMeta = {
  id: string;
  name: string;
  color: string;
  icon: string;
  total: number;
  /** Roll-up area: engineering, design, professional, leisure */
  domain?: LexiconDomainId;
};

export type WordEntry = {
  id: string;
  word: string;
  pos: string;
  definition: string;
  /** IPA transcription, e.g. /ˈmɪd.əl.weə/ */
  ipa?: string;
  /** Spanish gloss for learners */
  translation?: string;
  difficulty: 1 | 2 | 3;
  tags: string[];
  example?: string;
};

export type LessonViewModel = {
  id: string;
  icon: string;
  title: string;
  color: string;
  totalWords: number;
  wordsCompleted: number;
  wordsReviewing: number;
  progress: number;
  tags: string[];
};

export type LexiconSearchHit = {
  id: string;
  word: string;
  definition: string;
  pos: string;
  ipa?: string;
  translation?: string;
  categoryId: string;
  categoryName: string;
};

export type CategoryMeta = {
  id: string;
  name: string;
  color: string;
  icon: string;
  total: number;
};

export type WordEntry = {
  id: string;
  word: string;
  pos: string;
  definition: string;
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
  progress: number;
  tags: string[];
};

export type ImmersionLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export type ImmersionTopic =
  | 'speaking'
  | 'pronunciation'
  | 'connected-speech'
  | 'conversation'
  | 'intonation'
  | 'vocabulary';

export const IMMERSION_TEACHERS = [
  'Emma',
  'Ronnie',
  'James',
  'Rebecca',
  'Gill',
  'Adam',
  'Alex',
  'Benjamin',
  'Jon',
  'Jade',
] as const;

export type ImmersionTeacher = (typeof IMMERSION_TEACHERS)[number];

const TEACHER_BY_LOWER = new Map(
  IMMERSION_TEACHERS.map((teacher) => [teacher.toLowerCase(), teacher] as const),
);

/** Maps scraped names like "adam" to the canonical union member "Adam". */
export function normalizeImmersionTeacher(raw: string): ImmersionTeacher | null {
  return TEACHER_BY_LOWER.get(raw.trim().toLowerCase()) ?? null;
}

export interface LessonTimestamp {
  seconds: number;
  label: string;
  description?: string;
}

export interface KeyVocabularyItem {
  word: string;
  ipa: string;
  definition: string;
  contextSentence: string;
}

export interface TargetPhraseItem {
  phrase: string;
  ipa?: string;
  note?: string;
}

export interface ImmersionQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface ImmersionLesson {
  id: string;
  slug: string;
  youtubeVideoId: string;
  title: string;
  teacher: ImmersionTeacher;
  teacherChannelUrl: string;
  level: ImmersionLevel;
  topic: ImmersionTopic;
  durationMinutes: number;
  summary: string;
  timestamps: LessonTimestamp[];
  keyVocabulary: KeyVocabularyItem[];
  targetPhrases: TargetPhraseItem[];
  quiz: ImmersionQuizQuestion[];
}

export interface ImmersionProgress {
  lessonId: string;
  watched: boolean;
  completedAt?: string;
  quizScore?: number;
}

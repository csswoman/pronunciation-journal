import { LessonDetailHeader } from "./LessonDetailHeader";
import type { Word } from "./WordGrid";

interface LessonDetailActionsProps {
  title: string;
  blurb: string;
  totalWords: number;
  wordsLearned: number;
  wordsReviewing: number;
  color: string;
  categoryId: string;
  words: Word[];
}

export function LessonDetailActions({
  title,
  blurb,
  totalWords,
  wordsLearned,
  wordsReviewing,
  color,
  categoryId,
}: LessonDetailActionsProps) {
  return (
    <LessonDetailHeader
      title={title}
      blurb={blurb}
      totalWords={totalWords}
      wordsLearned={wordsLearned}
      wordsReviewing={wordsReviewing}
      color={color}
      categoryId={categoryId}
    />
  );
}

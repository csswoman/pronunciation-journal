import { LessonDetailHeader } from "./LessonDetailHeader";

interface LessonDetailActionsProps {
  title: string;
  blurb: string;
  totalWords: number;
  wordsLearned: number;
  wordsReviewing: number;
  color: string;
  categoryId: string;
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

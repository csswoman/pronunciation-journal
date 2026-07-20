import { LessonDetailHeader } from "./LessonDetailHeader";

interface LessonDetailActionsProps {
  title: string;
  blurb: string;
}

export function LessonDetailActions({
  title,
  blurb,
}: LessonDetailActionsProps) {
  return (
    <LessonDetailHeader
      title={title}
      blurb={blurb}
    />
  );
}

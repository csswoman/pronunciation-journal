import type { LessonTitleProps } from "./types";

export default function LessonTitle({ title }: LessonTitleProps) {
  return (
    <h3 className="line-clamp-2 text-base font-semibold text-fg transition group-hover:text-[var(--primary)]">
      {title}
    </h3>
  );
}

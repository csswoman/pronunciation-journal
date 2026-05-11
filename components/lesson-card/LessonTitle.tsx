import type { LessonTitleProps } from "./types";
import { H3 } from "@/components/ui/Typography";

export default function LessonTitle({ title }: LessonTitleProps) {
  return (
    <H3 className="line-clamp-2 text-base font-semibold transition group-hover:text-[var(--primary)]">
      {title}
    </H3>
  );
}

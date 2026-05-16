import { ReactNode } from "react";
import Button from "@/components/ui/Button";
import { H3 } from "@/components/ui/Typography";

type Difficulty = "easy" | "medium" | "hard";

interface LessonCardProps {
  title: string;
  description: string;
  difficulty: Difficulty;
  duration?: string;
  illustration?: ReactNode;
  onStart: () => void;
}

const difficultyDot: Record<Difficulty, string> = {
  easy: "dot-success",
  medium: "dot-warning",
  hard: "dot-warning",
};

export default function LessonCard({
  title,
  description,
  difficulty,
  duration,
  illustration,
  onStart,
}: LessonCardProps) {
  return (
    <div
      className="bg-[var(--card-bg)] border border-[var(--line-divider)]
 rounded-2xl p-6 flex flex-col cursor-pointer
 transition-all duration-200
 hover:bg-[var(--btn-card-bg-hover)]
 hover:border-[var(--line-color)] hover:-translate-y-0.5 shadow-card"
    >
      {/* Illustration area */}
      <div className="w-full h-[120px] rounded-xl bg-[var(--page-bg)] mb-5 flex items-center justify-center overflow-hidden">
        {illustration ?? (
          <span className="text-3xl opacity-30">📖</span>
        )}
      </div>

      {/* Tags row */}
      <div className="flex items-center gap-2 mb-2">
        <span className="badge">
          <span className={difficultyDot[difficulty]} />
          {difficulty}
        </span>
        {duration && (
          <span className="text-tiny font-medium text-fg-subtle">{duration}</span>
        )}
      </div>

      {/* Text */}
      <H3 className="font-heading text-sm font-bold mb-1">{title}</H3>
      <p className="text-xs text-fg-subtle leading-relaxed flex-1">{description}</p>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-[var(--line-divider)]">
        <span className="text-xs text-fg-subtle">
          {difficulty === "easy" ? "Beginner" : difficulty === "medium" ? "Intermediate" : "Advanced"}
        </span>
        <Button
          onClick={onStart}
          variant="secondary"
          size="sm"
        >
          Start
        </Button>
      </div>
    </div>
  );
}

interface LessonGridProps {
  children: ReactNode;
}

export function LessonGrid({ children }: LessonGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{children}</div>
  );
}





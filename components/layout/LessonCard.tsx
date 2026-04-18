import { ReactNode } from "react";
import Button from "@/components/ui/Button";

type Difficulty = "easy" | "medium" | "hard";

interface LessonCardProps {
  title: string;
  description: string;
  difficulty: Difficulty;
  duration?: string;
  illustration?: ReactNode;
  onStart: () => void;
}

const difficultyClasses: Record<Difficulty, string> = {
  easy:   "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  medium: "bg-amber-100   text-amber-800   dark:bg-amber-900/30   dark:text-amber-400",
  hard:   "bg-red-100     text-red-800     dark:bg-red-900/30     dark:text-red-400",
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
        hover:border-[var(--line-color)] hover:-translate-y-0.5"
      style={{ boxShadow: "0 1px 3px var(--line-divider), 0 4px 12px var(--line-divider)" }}
    >
      {/* Illustration area */}
      <div className="w-full h-[120px] rounded-xl bg-[var(--page-bg)] mb-5 flex items-center justify-center overflow-hidden">
        {illustration ?? (
          <span className="text-3xl opacity-30">📖</span>
        )}
      </div>

      {/* Tags row */}
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md ${difficultyClasses[difficulty]}`}>
          {difficulty}
        </span>
        {duration && (
          <span className="text-[10px] font-medium text-[var(--text-tertiary)]">{duration}</span>
        )}
      </div>

      {/* Text */}
      <h3 className="font-heading text-sm font-bold text-[var(--deep-text)] mb-1">{title}</h3>
      <p className="text-xs text-[var(--text-tertiary)] leading-relaxed flex-1">{description}</p>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-[var(--line-divider)]">
        <span className="text-xs text-[var(--text-tertiary)]">
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

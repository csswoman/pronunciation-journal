import type { LessonViewModel } from "@/lib/lexicon/types";

// Planned structure:
// <UnstartedDecksBar>
//   <div (Bar Container)>
//     <div (Left Title & Chips Row)>
//       <span> (Title)
//       <div (Deck Chips List with Pastel Dots)>
//     <button (+ Añadir un mazo)>
//   </div>
// </UnstartedDecksBar>

interface UnstartedDecksBarProps {
  unstartedLessons: LessonViewModel[];
  onAddDeck?: () => void;
}

const CATEGORY_DOT_COLORS: Record<string, string> = {
  "ux-design": "bg-[#f7b7a6]",
  "design-systems": "bg-[#cbbcf5]",
  "personal-interview": "bg-[#f8e08e]",
  professional: "bg-[#b9d3fb]",
  "technical-writing": "bg-[#a8e6c9]",
  "artificial-intelligence": "bg-[#b9d3fb]",
  "backend-infra": "bg-[#cbbcf5]",
  "data-science": "bg-[#f8e08e]",
  "frontend-dev": "bg-[#a8e6c9]",
};

export function UnstartedDecksBar({
  unstartedLessons,
  onAddDeck,
}: UnstartedDecksBarProps) {
  if (unstartedLessons.length === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-surface-raised border border-border-subtle/80 p-4 sm:p-5 shadow-2xs">
      <div className="space-y-2.5 min-w-0 flex-1">
        <h4 className="font-display font-bold text-body-sm text-fg tracking-tight">
          {unstartedLessons.length} {unstartedLessons.length === 1 ? "mazo sin empezar" : "mazos sin empezar"}
        </h4>

        <div className="flex flex-wrap items-center gap-2">
          {unstartedLessons.map((lesson) => {
            const dotColor = CATEGORY_DOT_COLORS[lesson.id] ?? "bg-[#b9d3fb]";
            return (
              <span
                key={lesson.id}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-sunken border border-border-subtle text-xs font-semibold text-fg select-none"
              >
                <span className={`h-2.5 w-2.5 rounded-full ${dotColor} shrink-0`} />
                <span>{lesson.title}</span>
              </span>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={onAddDeck}
        className="inline-flex items-center justify-center gap-1.5 shrink-0 rounded-full border border-border-subtle/80 bg-surface-raised hover:bg-surface-sunken text-fg font-semibold px-4 py-2 text-body-sm transition-all focus-ring shadow-2xs"
      >
        <span>+ Añadir un mazo</span>
      </button>
    </div>
  );
}

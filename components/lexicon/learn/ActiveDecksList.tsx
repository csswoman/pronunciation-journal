import { getIllustration } from "@/lib/illustrations/registry";
import { illustrationForCategory } from "@/lib/lexicon/category-illustrations";
import type { LessonViewModel } from "@/lib/lexicon/types";

// Planned structure:
// <ActiveDecksList>
//   <div (Header Row)>
//   <div (Decks Stack)>
//     <div (Deck Card Row)>
//       <div (Semi-square Pastel Icon)>
//       <div (Deck Info Column)>
//       <div (Stat Boxes & Action Button)>
//   </div>
// </ActiveDecksList>

interface ActiveDecksListProps {
  lessons: LessonViewModel[];
  onSelectDeck: (categoryId: string) => void;
}

const CATEGORY_PASTEL_VARS: Record<string, string> = {
  "artificial-intelligence": "var(--sky)",
  "backend-infra": "var(--lilac)",
  "data-science": "var(--butter)",
  "frontend-dev": "var(--mint)",
  "ux-design": "var(--coral)",
  "design-systems": "var(--lilac)",
  "personal-interview": "var(--butter)",
  professional: "var(--sky)",
  "technical-writing": "var(--mint)",
};

export function ActiveDecksList({ lessons, onSelectDeck }: ActiveDecksListProps) {
  if (lessons.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
        <div className="flex items-center gap-2.5">
          <h3 className="font-display font-extrabold text-h3 text-fg tracking-tight">
            Estás aprendiendo
          </h3>
          <span className="rounded-full bg-surface-sunken border border-border-subtle/80 px-2.5 py-0.5 text-xs font-semibold text-fg-muted">
            {lessons.length} {lessons.length === 1 ? "mazo" : "mazos"}
          </span>
        </div>
        <span className="text-caption text-fg-muted font-medium">
          Estudia solo uno si hoy tienes poco tiempo.
        </span>
      </div>

      <div className="space-y-3">
        {lessons.map((lesson) => {
          const illustrationKey = illustrationForCategory(lesson.id);
          const Illustration = illustrationKey ? getIllustration(illustrationKey) : null;
          const pastelBg = CATEGORY_PASTEL_VARS[lesson.id] ?? "var(--sky)";
          const learningCount = lesson.wordsReviewing;
          const unstartedCount = Math.max(0, lesson.totalWords - lesson.wordsCompleted - learningCount);
          const progressPct = lesson.totalWords > 0 ? Math.round((lesson.wordsCompleted / lesson.totalWords) * 100) : 0;
          const dueCount = lesson.wordsReviewing;
          const newCount = Math.min(5, unstartedCount);

          return (
            <div
              key={lesson.id}
              className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-surface-raised border border-border-subtle/80 p-4 shadow-2xs hover:border-primary/50 transition-all duration-150"
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <div
                  className="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl border border-black/5 p-3 text-stone-900 transition-transform duration-150 group-hover:scale-[1.03]"
                  style={{ backgroundColor: pastelBg }}
                  aria-hidden
                >
                  {Illustration ? (
                    <Illustration className="h-full w-full object-contain text-stone-900" />
                  ) : (
                    <span className="font-bold text-h4 text-stone-900">{lesson.title.charAt(0)}</span>
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-display font-bold text-fg text-body sm:text-body-lg truncate tracking-tight">
                      {lesson.title}
                    </h4>
                    <span className="rounded-full bg-surface-sunken text-fg-muted px-2 py-0.5 text-[11px] font-semibold border border-border-subtle">
                      {lesson.studyMode === "receptive" ? "Reconocer" : "Producir"}
                    </span>
                  </div>

                  <p className="text-caption text-fg-muted font-medium">
                    {learningCount} aprendiendo · {unstartedCount} por empezar
                  </p>

                  <div className="h-2 w-full max-w-xs rounded-full bg-surface-sunken overflow-hidden" aria-hidden>
                    <div
                      className="h-full bg-amber-400 dark:bg-amber-500 rounded-full transition-all duration-300"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border-subtle/40">
                <div className="flex items-center gap-2">
                  <div className="bg-coral-soft dark:bg-rose-950/40 text-stone-900 dark:text-rose-200 border border-rose-200/50 rounded-2xl px-3.5 py-1.5 text-center min-w-[60px]">
                    <span className="block font-bold text-body-sm leading-none">{dueCount}</span>
                    <span className="block text-[10px] font-medium leading-tight text-stone-700 dark:text-rose-300 mt-0.5">repasar</span>
                  </div>

                  <div className="bg-sky-soft dark:bg-sky-950/40 text-stone-900 dark:text-sky-200 border border-sky-200/50 rounded-2xl px-3.5 py-1.5 text-center min-w-[60px]">
                    <span className="block font-bold text-body-sm leading-none">{newCount}</span>
                    <span className="block text-[10px] font-medium leading-tight text-stone-700 dark:text-sky-300 mt-0.5">nuevas</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectDeck(lesson.id)}
                  className="inline-flex items-center justify-center min-h-[40px] rounded-full border border-border-subtle/80 bg-surface-raised text-fg px-5 py-2 text-body-sm font-semibold hover:bg-surface-sunken active:scale-[0.98] transition-all focus-ring shadow-2xs"
                >
                  Estudiar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

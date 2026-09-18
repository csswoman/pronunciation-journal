import { DOT_COLORS, timeUntil } from "./study-utils";
import type { Tables } from "@/lib/supabase/types";

type Progress = Tables<"deck_entry_progress">;
type Entry = Tables<"entries">;

interface CardWithProgress extends Entry {
  progress: Progress | null;
}

interface SessionStats {
  seen: number;
  again: number;
  hard: number;
  easy: number;
  newlyMastered: number;
}

interface StudyRightPanelProps {
  currentIndex?: number;
  totalCards?: number;
  stats: SessionStats;
  upcomingCards: CardWithProgress[];
  onSkip?: () => void;
  onClose?: () => void;
}

export function StudyRightPanel({
  currentIndex = 0,
  totalCards = 12,
  stats,
  upcomingCards,
  onSkip,
  onClose,
}: StudyRightPanelProps) {
  return (
    <div className="hidden lg:flex flex-col justify-between gap-6 w-52 xl:w-60 shrink-0 select-none">
      <div className="flex flex-col gap-6">
        {/* ESTA SESIÓN */}
        <div className="flex flex-col gap-3 rounded-2xl border border-border-default bg-surface-raised p-4 shadow-2xs">
          <p className="font-kicker text-caption font-bold text-fg-subtle uppercase tracking-wider">
            Esta sesión
          </p>
          <p className="font-heading text-body-md font-bold text-fg">
            {currentIndex + 1} <span className="font-sans text-caption font-medium text-fg-muted">de {totalCards} tarjetas</span>
          </p>
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="px-2.5 py-1 rounded-full bg-[#a3e8ca] text-emerald-950 text-tiny font-extrabold border-none shadow-2xs">
              {stats.easy} bien
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[#fbe495] text-amber-950 text-tiny font-extrabold border-none shadow-2xs">
              {stats.hard} con esfuerzo
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[#f8b4a6] text-rose-950 text-tiny font-extrabold border-none shadow-2xs">
              {stats.again} falladas
            </span>
          </div>
        </div>

        {/* SIGUIENTES */}
        {upcomingCards.length > 0 && (
          <div className="flex flex-col gap-3 rounded-2xl border border-border-default bg-surface-raised p-4 shadow-2xs">
            <p className="font-kicker text-caption font-bold text-fg-subtle uppercase tracking-wider">
              Siguientes
            </p>
            <div className="flex flex-col gap-2">
              {upcomingCards.map((card, i) => {
                const dotColor = DOT_COLORS[i % DOT_COLORS.length];
                return (
                  <div
                    key={card.id}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-surface-sunken border border-border-subtle/70"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="size-2 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
                      <span className="font-sans text-body-sm font-bold text-fg truncate">
                        {card.word}
                      </span>
                    </div>
                    <span className="font-sans text-tiny font-medium text-fg-subtle shrink-0">
                      {timeUntil(card.progress?.next_review_at)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer de Atajos */}
      <div className="flex items-center justify-between px-1 text-caption text-fg-subtle font-medium">
        <button
          type="button"
          onClick={onSkip}
          className="focus-ring rounded-lg px-2 py-1 hover:bg-surface-raised hover:text-fg font-semibold transition-colors"
        >
          → saltar
        </button>
        <button
          type="button"
          onClick={onClose}
          className="focus-ring rounded-lg px-2 py-1 hover:bg-surface-raised hover:text-fg font-semibold transition-colors"
        >
          Esc salir
        </button>
      </div>
    </div>
  );
}

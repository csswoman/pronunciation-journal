// Planned structure:
// <DeckSidebarRail>
//   <RailHeader (kicker, total steps badge)>
//   <RailList (step buttons with status badge and title)>
//   <RailFooter (reviewed count, exit button)>
//   <RailImmersionLessonLink />
// </DeckSidebarRail>

"use client";

import Link from "next/link";
import { Check, Play } from "@/components/icons";
import { cn } from "@/lib/cn";
import type { GrammarStudyCardData } from "@/lib/courses/grammar-deck/types";
import type { ImmersionLesson } from "@/lib/immersion/types";

interface DeckSidebarRailProps {
  cards: GrammarStudyCardData[];
  currentIndex: number;
  reviewed: Set<string>;
  onSelectCard: (index: number) => void;
  immersionLesson?: ImmersionLesson | null;
  backHref?: string;
}

export default function DeckSidebarRail({
  cards,
  currentIndex,
  reviewed,
  onSelectCard,
  immersionLesson,
  backHref = "/courses",
}: DeckSidebarRailProps) {
  const reviewedCount = reviewed.size;
  const totalCount = cards.length;

  return (
    <aside className="grammar-deck__rail" aria-label="Tarjetas de esta lección">
      <div className="grammar-deck__rail-card">
        <div className="grammar-deck__rail-head">
          <span className="grammar-deck__rail-kicker">EN ESTA LECCIÓN</span>
          <span className="grammar-deck__rail-steps-badge">{totalCount} pasos</span>
        </div>

        <nav className="grammar-deck__rail-list" aria-label="Navegación de tarjetas">
          {cards.map((card, i) => {
            const isActive = i === currentIndex;
            const isDone = reviewed.has(card.id) || i < currentIndex;

            return (
              <button
                key={card.id}
                type="button"
                onClick={() => onSelectCard(i)}
                className={cn(
                  "grammar-deck__rail-item",
                  isActive && "grammar-deck__rail-item--active",
                  isDone && !isActive && "grammar-deck__rail-item--done",
                )}
                aria-current={isActive ? "step" : undefined}
              >
                <span className="grammar-deck__rail-badge">
                  {isDone && !isActive ? (
                    <Check size={14} strokeWidth={2.5} aria-hidden />
                  ) : (
                    i + 1
                  )}
                </span>
                <span className="grammar-deck__rail-title">{card.title}</span>
              </button>
            );
          })}
        </nav>

        <div className="grammar-deck__rail-footer">
          <span className="grammar-deck__rail-progress-text">
            {reviewedCount} de {totalCount} repasadas
          </span>
          <Link href={backHref} className="grammar-deck__rail-exit-btn">
            Salir y seguir luego
          </Link>
        </div>
      </div>

      {immersionLesson && (
        <div className="mt-4 border-t border-border-subtle pt-3">
          <span className="grammar-deck__rail-kicker mb-2 block">CLASE EN VIDEO</span>
          <Link
            href={`/practice/immersion/${immersionLesson.slug}`}
            className="flex flex-col gap-1.5 rounded-xl border border-border-subtle bg-white dark:bg-surface-base p-3 text-left transition-all hover:border-accent/40 hover:bg-accent-soft/40"
            title={immersionLesson.title}
          >
            <div className="flex items-center gap-2 text-accent">
              <Play size={14} className="fill-current" aria-hidden />
              <span className="text-caption font-semibold">
                {immersionLesson.teacher} · {immersionLesson.durationMinutes} min
              </span>
            </div>
            <p className="line-clamp-2 text-body-sm font-medium leading-snug text-fg">
              {immersionLesson.title}
            </p>
            <span className="text-caption font-medium text-accent/90">
              {immersionLesson.metadata?.relation === "exact" ? "Video canónico" : "Video relacionado"}
            </span>
          </Link>
        </div>
      )}
    </aside>
  );
}


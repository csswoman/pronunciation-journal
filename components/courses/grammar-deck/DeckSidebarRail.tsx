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
}

/**
 * Desktop sidebar rail listing all cards in the lesson.
 * Displays progress state (active, done, upcoming) and enables direct jumping.
 */
export default function DeckSidebarRail({
  cards,
  currentIndex,
  reviewed,
  onSelectCard,
  immersionLesson,
}: DeckSidebarRailProps) {
  return (
    <aside className="grammar-deck__rail" aria-label="Tarjetas de esta lección">
      <span className="grammar-deck__rail-kicker">EN ESTA LECCIÓN</span>
      <nav className="grammar-deck__rail-list" aria-label="Navegación de tarjetas">
        {cards.map((card, i) => {
          const isActive = i === currentIndex;
          const isDone = reviewed.has(card.id);

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

      {immersionLesson && (
        <div className="mt-4 border-t border-border-subtle pt-3">
          <span className="grammar-deck__rail-kicker mb-2 block">CLASE EN VIDEO</span>
          <Link
            href={`/practice/immersion/${immersionLesson.slug}`}
            className="flex flex-col gap-1.5 rounded-xl border border-border-subtle bg-surface-raised p-3 text-left transition-all hover:border-accent/40 hover:bg-accent-soft/40"
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
            <span className="font-mono text-[10px] text-accent/90">
              {immersionLesson.metadata?.relation === "exact" ? "Video canónico" : "Video relacionado"}
            </span>
          </Link>
        </div>
      )}
    </aside>
  );
}

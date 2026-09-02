"use client";

import { Check } from "@/components/icons";
import { cn } from "@/lib/cn";
import type { GrammarStudyCardData } from "@/lib/courses/grammar-deck/types";

interface DeckSidebarRailProps {
  cards: GrammarStudyCardData[];
  currentIndex: number;
  reviewed: Set<string>;
  onSelectCard: (index: number) => void;
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
    </aside>
  );
}

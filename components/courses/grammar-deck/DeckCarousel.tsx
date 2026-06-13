"use client";

// Planned structure:
// <DeckCarousel>
//   navigation dots (dot per card, clickable)
//   <GrammarStudyCard />  (animated slide)
//   prev/next arrows
// </DeckCarousel>

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import GrammarStudyCard from "./GrammarStudyCard";
import type { GrammarStudyDeckData } from "@/lib/courses/grammar-deck/types";

interface DeckCarouselProps {
  cards: GrammarStudyDeckData["cards"];
  index: number;
  direction: "next" | "prev";
  reviewed: Set<string>;
  isLast: boolean;
  onPrev: () => void;
  onNext: () => void;
  onGoTo: (i: number) => void;
  onToggleReviewed: (id: string) => void;
}

export function DeckCarousel({
  cards,
  index,
  direction,
  reviewed,
  isLast,
  onPrev,
  onNext,
  onGoTo,
  onToggleReviewed,
}: DeckCarouselProps) {
  const card = cards[index];
  const total = cards.length;

  return (
    <div className="grammar-deck__carousel">
      <div className="grammar-deck__viewport">
        <div
          key={card.id}
          className={cn(
            "grammar-deck__slide",
            direction === "next" ? "grammar-deck__slide--next" : "grammar-deck__slide--prev"
          )}
        >
          <GrammarStudyCard
            card={card}
            reviewed={reviewed.has(card.id)}
            onToggleReviewed={() => onToggleReviewed(card.id)}
          />
        </div>
      </div>

      <nav className="grammar-deck__nav" aria-label="Navegación de tarjetas">
        <button
          type="button"
          className="grammar-deck__arrow"
          onClick={onPrev}
          disabled={index === 0}
          aria-label="Tarjeta anterior"
        >
          <ChevronLeft size={20} aria-hidden />
        </button>

        <div className="grammar-deck__pager">
          <div className="grammar-deck__dots" role="tablist" aria-label="Tarjetas">
            {cards.map((c, i) => (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Tarjeta ${i + 1}`}
                className={cn(
                  "grammar-deck__dot",
                  i === index && "grammar-deck__dot--on",
                  reviewed.has(c.id) && "grammar-deck__dot--done"
                )}
                onClick={() => onGoTo(i)}
              />
            ))}
          </div>
          <span className="grammar-deck__pos">
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
        </div>

        {isLast ? (
          <button
            type="button"
            className="grammar-deck__finish"
            onClick={onNext}
            aria-label="Finalizar lección"
          >
            Finalizar
            <ChevronRight size={16} aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            className="grammar-deck__arrow grammar-deck__arrow--next"
            onClick={onNext}
            aria-label="Tarjeta siguiente"
          >
            <ChevronRight size={20} aria-hidden />
          </button>
        )}
      </nav>
    </div>
  );
}

"use client";

import { cn } from "@/lib/cn";
import GrammarStudyCard from "./GrammarStudyCard";
import type { GrammarStudyDeckData } from "@/lib/courses/grammar-deck/types";

interface DeckCarouselProps {
  cards: GrammarStudyDeckData["cards"];
  index: number;
  direction: "next" | "prev";
  reviewed: Set<string>;
  isLast: boolean;
  onNext: () => void;
}

export function DeckCarousel({
  cards,
  index,
  direction,
  reviewed,
  isLast,
  onNext,
}: DeckCarouselProps) {
  const card = cards[index];

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
            isLast={isLast}
            onAdvance={onNext}
          />
        </div>
      </div>
    </div>
  );
}

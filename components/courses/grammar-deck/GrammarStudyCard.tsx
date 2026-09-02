"use client";

import { ArrowRight, Check } from "@/components/icons";
import { cn } from "@/lib/cn";
import type { GrammarStudyCardData } from "@/lib/courses/grammar-deck/types";
import GrammarCardTitle from "./GrammarCardTitle";
import GrammarCardBody from "./GrammarCardBody";

interface GrammarStudyCardProps {
  card: GrammarStudyCardData;
  reviewed: boolean;
  /** True when this is the final card — the CTA finishes the lesson instead of advancing. */
  isLast: boolean;
  /** Mark this card reviewed and move to the next card (or finish on the last one). */
  onAdvance: () => void;
}

export default function GrammarStudyCard({
  card,
  reviewed,
  isLast,
  onAdvance,
}: GrammarStudyCardProps) {
  const indexLabel = String(card.index).padStart(2, "0");

  // The foot CTA carries the whole progression: it marks the card reviewed and
  // advances in one move. Three faces so it never reads as a dead-end:
  //  · unreviewed        → primary "Marcar como repasada"  (advance)
  //  · reviewed, mid-deck → soft "Repasada · Siguiente"     (advance, no re-toggle)
  //  · last card          → primary "Terminar lección"      (to quiz / done)
  const ctaLabel = isLast
    ? "Terminar lección"
    : reviewed
      ? "Repasada · Siguiente"
      : "Marcar como repasada";

  return (
    <article className={cn("grammar-card", reviewed && "grammar-card--done")}>
      <div className="grammar-card__intro">
        <div className="grammar-card__top">
          <span className="grammar-card__tag">{card.tag}</span>
          <span className="grammar-card__idx">{indexLabel}</span>
        </div>

        <GrammarCardTitle title={card.title} titleItalic={card.titleItalic} />
        <p className="grammar-card__lede">{card.lede}</p>
      </div>

      <GrammarCardBody blocks={card.blocks} />

      {card.tip && (
        <p className="grammar-card__tip">
          <b>{card.tip.label}</b> {card.tip.body}
        </p>
      )}

      <button
        type="button"
        className={cn(
          "grammar-card__advance",
          reviewed && !isLast && "grammar-card__advance--soft",
        )}
        onClick={onAdvance}
      >
        {reviewed && !isLast && <Check size={16} strokeWidth={2.5} aria-hidden />}
        <span>{ctaLabel}</span>
        <ArrowRight size={16} strokeWidth={2.5} aria-hidden className="grammar-card__advance-arrow" />
      </button>
    </article>
  );
}

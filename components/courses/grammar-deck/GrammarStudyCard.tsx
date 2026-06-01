"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import type { GrammarStudyCardData } from "@/lib/courses/grammar-deck/types";
import GrammarCardTitle from "./GrammarCardTitle";
import GrammarCardBody from "./GrammarCardBody";

interface GrammarStudyCardProps {
  card: GrammarStudyCardData;
  reviewed: boolean;
  onToggleReviewed: () => void;
}

export default function GrammarStudyCard({ card, reviewed, onToggleReviewed }: GrammarStudyCardProps) {
  const indexLabel = String(card.index).padStart(2, "0");

  return (
    <article className={cn("grammar-card", reviewed && "grammar-card--done")}>
      <div className="grammar-card__top">
        <span className="grammar-card__tag">{card.tag}</span>
        <span className="grammar-card__idx">{indexLabel}</span>
      </div>

      <GrammarCardTitle title={card.title} titleItalic={card.titleItalic} />
      <p className="grammar-card__lede">{card.lede}</p>

      <GrammarCardBody blocks={card.blocks} />

      {card.tip && (
        <p className="grammar-card__tip">
          <b>{card.tip.label}</b> {card.tip.body}
        </p>
      )}

      <button type="button" className="grammar-card__gotit" onClick={onToggleReviewed}>
        {reviewed ? (
          <>
            <Check size={16} strokeWidth={2.5} aria-hidden />
            Repasada
          </>
        ) : (
          "Marcar como repasada"
        )}
      </button>
    </article>
  );
}

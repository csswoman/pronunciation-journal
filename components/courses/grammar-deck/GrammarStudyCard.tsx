// Planned structure:
// <GrammarStudyCard>
//   <CardHeader (tag, step count badge, watermark step number)>
//   <CardTitleAndLede />
//   <CardWhiteBody (GrammarCardBody)>
//   <CardMeetingBanner (audio callout quote)>
//   <CardFooterActions (primary CTA, secondary save terms CTA, shortcut tip)>
// </GrammarStudyCard>

"use client";

import { useCallback, useState } from "react";
import { ArrowRight, Check, Play, Plus, Volume2 } from "@/components/icons";
import { cn } from "@/lib/cn";
import type { GrammarStudyCardData } from "@/lib/courses/grammar-deck/types";
import GrammarCardTitle from "./GrammarCardTitle";
import GrammarCardBody from "./GrammarCardBody";

interface GrammarStudyCardProps {
  card: GrammarStudyCardData;
  totalCount?: number;
  reviewed: boolean;
  /** True when this is the final card — the CTA finishes the lesson instead of advancing. */
  isLast: boolean;
  /** Mark this card reviewed and move to the next card (or finish on the last one). */
  onAdvance: () => void;
}

export default function GrammarStudyCard({
  card,
  totalCount = 6,
  reviewed,
  isLast,
  onAdvance,
}: GrammarStudyCardProps) {
  const indexLabel = String(card.index).padStart(2, "0");
  const [isPlayingQuote, setIsPlayingQuote] = useState(false);
  const [isSavedTerms, setIsSavedTerms] = useState(false);

  const ctaLabel = isLast
    ? "Terminar lección"
    : reviewed
      ? "Repasada · Siguiente"
      : "Marcar como repasada";

  const handlePlayQuote = useCallback(() => {
    if (!card.meetingQuote?.quote || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(card.meetingQuote.quote);
    utter.lang = "en-US";
    utter.rate = 0.95;
    utter.onstart = () => setIsPlayingQuote(true);
    utter.onend = () => setIsPlayingQuote(false);
    utter.onerror = () => setIsPlayingQuote(false);
    synth.speak(utter);
  }, [card.meetingQuote]);

  // Count items/verbs for "+ Guardar los X verbos" label
  const firstBlock = card.blocks[0];
  const itemCount =
    firstBlock?.type === "rules"
      ? firstBlock.rows.length
      : firstBlock?.type === "verb-table"
        ? firstBlock.rows.length
        : 4;

  return (
    <div className="grammar-card-wrap">
      <article className={cn("grammar-card", reviewed && "grammar-card--done")}>
        <div className="grammar-card__intro">
          <div className="grammar-card__top">
            <div className="grammar-card__badges">
              <span className="grammar-card__tag-black">{card.tag}</span>
              <span className="grammar-card__step-pill">paso {card.index} de {totalCount}</span>
            </div>
            <span className="grammar-card__watermark" aria-hidden="true">
              {indexLabel}
            </span>
          </div>

          <GrammarCardTitle title={card.title} titleItalic={card.titleItalic} />
          <p className="grammar-card__lede">{card.lede}</p>
        </div>

        <div className="grammar-card__inner-white">
          <GrammarCardBody blocks={card.blocks} />
        </div>

        {card.tip?.conventions ? (
          <div className="grammar-card__conventions-section">
            <h4 className="grammar-card__conventions-header">
              {card.tip.conventionsTitle ?? "CONVENCIONES QUE VERÁS EN LOS PR"}
            </h4>
            <div className="grammar-card__conventions-grid">
              {card.tip.conventions.map((conv, i) => (
                <div key={i} className="grammar-card__convention-card">
                  <span className="grammar-card__convention-badge">{conv.badge}</span>
                  <span className="grammar-card__convention-text">{conv.text}</span>
                </div>
              ))}
            </div>
          </div>
        ) : card.tip && !card.meetingQuote ? (
          <p className="grammar-card__tip">
            <b>{card.tip.label}</b> {card.tip.body}
          </p>
        ) : null}
      </article>

      {card.meetingQuote && (
        <div className="grammar-card__meeting-banner">
          <button
            type="button"
            className="grammar-card__meeting-play"
            onClick={handlePlayQuote}
            aria-label="Escuchar frase de reunión"
          >
            {isPlayingQuote ? (
              <Volume2 size={20} className="animate-pulse" aria-hidden />
            ) : (
              <Play size={20} className="ml-0.5 fill-current" aria-hidden />
            )}
          </button>
          <div className="grammar-card__meeting-content">
            <span className="grammar-card__meeting-kicker">
              {card.meetingQuote.kicker ?? "ASÍ SUENA EN UNA REUNIÓN"}
            </span>
            <p className="grammar-card__meeting-quote">
              “{card.meetingQuote.quote}”
            </p>
            <p className="grammar-card__meeting-translation">
              {card.meetingQuote.translation}
            </p>
          </div>
          <button
            type="button"
            className="grammar-card__meeting-repeat-btn"
            onClick={handlePlayQuote}
          >
            Repetir en voz alta
          </button>
        </div>
      )}

      <div className="grammar-card__actions-row">
        <div className="grammar-card__btn-group">
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

          <button
            type="button"
            className="grammar-card__save-terms-btn"
            onClick={() => setIsSavedTerms((prev) => !prev)}
          >
            {isSavedTerms ? (
              <>
                <Check size={15} className="text-success" aria-hidden />
                <span>Verbos guardados</span>
              </>
            ) : (
              <>
                <Plus size={15} aria-hidden />
                <span>+ Guardar los {itemCount} verbos</span>
              </>
            )}
          </button>
        </div>

        <span className="grammar-card__shortcut-note">Enter para avanzar</span>
      </div>
    </div>
  );
}


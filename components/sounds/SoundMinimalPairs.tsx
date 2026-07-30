"use client";

import { useId, useState } from "react";
import { ChevronDown, ChevronUp, Headphones } from "@/components/icons";
import type { PhonemeExtra } from "@/lib/pronunciation/ipa-data";
import { SoundAudioButton } from "./SoundAudioButton";
import { MinimalPairsRunner } from "./MinimalPairsRunner";

export function SoundMinimalPairs({
  pairs,
  speaking,
  onSpeak,
  phoneme,
}: {
  pairs: PhonemeExtra["minimalPairs"];
  speaking: string | null;
  onSpeak: (word: string) => void;
  phoneme: string;
}) {
  const contentId = useId();
  const headingId = useId();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPracticing, setIsPracticing] = useState(false);

  return (
    <section className="sound-detail__pairs-section" aria-labelledby={headingId}>
      <div className="sound-detail__pairs-header">
        <div className="sound-detail__pairs-header-copy">
          <h3 id={headingId} className="ipa-chart__panel-sec m-0">Pares mínimos</h3>
          <p className="sound-detail__pairs-summary">
            {pairs.length} pares de palabras que cambian un solo sonido
          </p>
        </div>
        <button
          type="button"
          className="sound-detail__collapse sound-detail__pairs-toggle"
          onClick={() => {
            if (isExpanded && isPracticing) setIsPracticing(false);
            setIsExpanded((current) => !current);
          }}
          aria-expanded={isExpanded}
          aria-controls={contentId}
          aria-label={
            isExpanded
              ? isPracticing
                ? "Cerrar y reiniciar práctica"
                : "Cerrar pares mínimos"
              : `Ver ${pairs.length} pares mínimos`
          }
        >
          <span className="sound-detail__collapse-label">
            {isExpanded ? (isPracticing ? "Cerrar y reiniciar" : "Cerrar pares") : "Ver pares"}
            {isExpanded ? <ChevronUp size={14} aria-hidden /> : <ChevronDown size={14} aria-hidden />}
          </span>
        </button>
      </div>
      {isPracticing ? (
        <span className="sr-only" role="status">Práctica de pares abierta.</span>
      ) : null}
      <div id={contentId} className="sound-detail__pairs-content" hidden={!isExpanded}>
        {isPracticing ? (
          <MinimalPairsRunner
            initialPhoneme={phoneme}
            embedded
            onExit={() => setIsPracticing(false)}
          />
        ) : (
          <>
            <p className="sound-detail__pairs-intro">
              Escucha y compara estas palabras que solo cambian en un sonido antes de practicar.
            </p>
            <div className="sound-detail__pairs">
              {pairs.map((pair) => (
                <div key={`${pair.wordA}-${pair.wordB}`} className="sound-detail__pair">
                  <SoundAudioButton
                    word={pair.wordA}
                    speaking={speaking === pair.wordA}
                    onSpeak={onSpeak}
                  />
                  <span className="sound-detail__pair-separator" aria-hidden>
                    /
                  </span>
                  <SoundAudioButton
                    word={pair.wordB}
                    speaking={speaking === pair.wordB}
                    onSpeak={onSpeak}
                  />
                </div>
              ))}
            </div>
            <button
              type="button"
              className="sound-detail__pairs-start"
              onClick={() => setIsPracticing(true)}
            >
              <Headphones size={15} aria-hidden />
              Practicar estos pares
            </button>
          </>
        )}
      </div>
    </section>
  );
}

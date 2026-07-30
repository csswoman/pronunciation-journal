"use client";

import { useId } from "react";
import { SoundAudioButton } from "./SoundAudioButton";

export function SoundExamples({
  examples,
  speaking,
  onSpeak,
}: {
  examples: string[];
  speaking: string | null;
  onSpeak: (word: string) => void;
}) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId}>
      <h3 id={headingId} className="ipa-chart__panel-sec m-0">Ejemplos</h3>
      <div className="ipa-chart__exwords sound-detail__section-content">
        {examples.map((word) => (
          <SoundAudioButton
            key={word}
            word={word}
            speaking={speaking === word}
            onSpeak={onSpeak}
            className="ipa-chart__exword"
          />
        ))}
      </div>
    </section>
  );
}

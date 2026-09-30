"use client";

// Planned structure:
// <SoundLabRecommendedPractice>
//   <AvatarIpaCircle />
//   <PhraseContent />
//   <AudioAndStartActions />
// </SoundLabRecommendedPractice>

import { Volume2 } from "@/components/icons";
import Button from "@/components/ui/Button";
import PastelCard from "@/components/layout/PastelCard";
import { formatIpaDisplay } from "@/lib/lexicon/format-ipa";
import type { SoundLabPhraseRecommendation } from "@/lib/sound-lab/recommended-phrase";
import { useSpeakWord } from "@/hooks/useSpeakWord";

interface Props {
  recommendation: SoundLabPhraseRecommendation;
  onStart: () => void;
}

export function SoundLabRecommendedPractice({ recommendation, onStart }: Props) {
  const { speak } = useSpeakWord();
  const targetSymbol = recommendation.targetIpas[0] || "/ɹ/";

  return (
    <section aria-labelledby="sound-lab-recommended-title" className="w-full">
      <PastelCard
        tone="butter"
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl"
      >
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {/* Circular avatar badge with target IPA */}
          <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full border border-ink/20 bg-surface/30 flex items-center justify-center shrink-0 shadow-2xs">
            <span className="font-ipa text-xl sm:text-2xl font-bold text-ink">
              {targetSymbol}
            </span>
          </div>

          <div className="flex flex-col min-w-0">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink-muted">
              TU PRÁCTICA RECOMENDADA
            </span>
            <h2
              id="sound-lab-recommended-title"
              className="text-xl sm:text-2xl font-extrabold text-ink leading-tight tracking-tight my-0.5"
              lang="en"
            >
              {recommendation.phrase}
            </h2>
            {recommendation.ipa ? (
              <p className="font-ipa text-body-sm text-ink-secondary my-0.5" lang="en-fonipa">
                {formatIpaDisplay(recommendation.ipa)}
              </p>
            ) : null}
            <p className="text-body-sm text-ink-muted leading-snug">
              {recommendation.meaning}
              {recommendation.reason ? ` · ${recommendation.reason}` : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end shrink-0 pt-2 sm:pt-0">
          <button
            type="button"
            onClick={() => speak(recommendation.phrase)}
            className="h-10 w-10 rounded-full bg-ink text-paper flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer shadow-xs"
            aria-label={`Escuchar la frase "${recommendation.phrase}"`}
            title="Escuchar pronunciación"
          >
            <Volume2 size={18} aria-hidden />
          </button>

          <Button
            variant="primary"
            size="md"
            onClick={onStart}
            className="bg-ink text-paper hover:bg-ink-secondary rounded-full px-6 py-2.5 font-semibold text-body-sm transition-all shadow-xs cursor-pointer active:scale-95"
          >
            Practicar esta frase
          </Button>
        </div>
      </PastelCard>
    </section>
  );
}

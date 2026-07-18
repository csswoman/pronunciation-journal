"use client";

import { Volume2 } from "@/components/icons";
import { getWordStrength } from "@/lib/word-bank/strength";
import { WordStrengthBars } from "@/components/vocabulary/words/WordStrengthBars";
import { speakText } from "@/lib/speech/synthesis";
import type { WordBankEntry } from "@/lib/word-bank/types";

interface HomeReviewWordRowProps {
  word: WordBankEntry;
  showDivider?: boolean;
}

function formatIpa(ipa: string | null | undefined): string {
  if (!ipa) return "";
  return ipa.startsWith("/") ? ipa : `/${ipa.replace(/^\/|\/$/g, "")}/`;
}

export default function HomeReviewWordRow({ word, showDivider }: HomeReviewWordRowProps) {
  const ipa = formatIpa(word.ipa);

  function speak() {
    speakText(word.text);
  }

  return (
    <div
      className={[
        "flex items-center gap-3 py-2.5",
        showDivider ? "border-b border-border-subtle" : "",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={speak}
        aria-label={`Play ${word.text}`}
        className="shrink-0 flex h-8 w-8 items-center justify-center text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)]"
      >
        <Volume2 size={15} />
      </button>

      <div className="min-w-0 flex-1">
        <p className="font-body-sm font-medium leading-tight text-fg">
          {word.text}
          {ipa ? (
            <small className="font-ipa ml-2 text-body-sm font-medium">{ipa}</small>
          ) : null}
        </p>
        {word.translation ? (
          <p className="font-caption mt-0.5 truncate text-fg-muted">{word.translation}</p>
        ) : null}
      </div>

      <WordStrengthBars strength={getWordStrength(word)} size={14} />
    </div>
  );
}

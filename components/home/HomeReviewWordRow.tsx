"use client";

import { Volume2 } from "lucide-react";
import { getWordStrength } from "@/lib/word-bank/strength";
import { WordStrengthBars } from "@/components/vocabulary/words/WordStrengthBars";
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
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word.text);
    utterance.lang = "en-US";
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
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
        <p className="text-sm font-medium leading-tight text-[var(--text-primary)]">
          <span
            style={{ fontFamily: "var(--font-display), serif" }}
          >
            {word.text}
          </span>
          {ipa ? (
            <small className="ml-2 font-ipa text-[13px] font-normal text-[var(--primary)]">
              {ipa}
            </small>
          ) : null}
        </p>
        {word.translation ? (
          <p className="mt-0.5 truncate text-xs text-[var(--text-tertiary)]">{word.translation}</p>
        ) : null}
      </div>

      <WordStrengthBars strength={getWordStrength(word)} size={14} />
    </div>
  );
}

"use client";

import { Volume2 } from "lucide-react";
import type { Tables } from "@/lib/supabase/types";

type Entry = Tables<"entries">;

function blankOutWord(sentence: string, word: string): string {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return sentence.replace(new RegExp(escaped, "gi"), "___");
}

interface StudyCardContentProps {
  entry: Entry;
  flipped: boolean;
  showAllMeanings: boolean;
  onToggleAllMeanings: () => void;
}

export function StudyCardContent({ entry, flipped, showAllMeanings, onToggleAllMeanings }: StudyCardContentProps) {
  const meanings = Array.isArray(entry.meanings) ? entry.meanings : [];
  const firstMeaning = meanings[0] as { partOfSpeech?: string; definitions?: { definition?: string; example?: string }[] } | undefined;
  const firstDefinition = firstMeaning?.definitions?.[0];
  const extraMeaningsCount = meanings.length - 1;
  const partOfSpeech = firstMeaning?.partOfSpeech;
  const difficultyLabel = entry.difficulty
    ? ["A1", "A2", "B1", "B2", "C1", "C2"][Math.min((entry.difficulty ?? 1) - 1, 5)]
    : null;

  function speakWord() {
    if (!entry.word) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(entry.word);
    utt.lang = "en-US";
    utt.rate = 0.85;
    window.speechSynthesis.speak(utt);
  }

  return (
    <div className="flex-1 p-5 flex flex-col justify-between" onClick={(e) => e.stopPropagation()}>
      {/* Tags row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex flex-wrap gap-1.5">
          {partOfSpeech && (
            <span className="px-2.5 py-0.5 rounded-full border border-[var(--line-divider)] text-xs font-medium text-[var(--text-secondary)]">
              {partOfSpeech}
            </span>
          )}
          {difficultyLabel && (
            <span className="badge">
              <span className="dot-info" />
              {difficultyLabel}
            </span>
          )}
        </div>
        {flipped && extraMeaningsCount > 0 && (
          <button
            onClick={onToggleAllMeanings}
            className="text-xs text-[var(--text-tertiary)] hover:text-[var(--deep-text)] whitespace-nowrap shrink-0 transition-colors"
          >
            {showAllMeanings ? "less ←" : `${extraMeaningsCount} more →`}
          </button>
        )}
      </div>

      {/* Word + IPA */}
      <div className="mb-4">
        <div className="flex items-baseline gap-3 flex-wrap">
          <h2 className="text-4xl md:text-5xl font-bold italic text-[var(--deep-text)] leading-none" style={{ fontFamily: "var(--font-serif, serif)" }}>
            {entry.word}
          </h2>
          {flipped && entry.ipa && (
            <span className="text-base text-[var(--text-secondary)]">/{entry.ipa}/</span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); speakWord(); }}
            className="p-1.5 rounded-lg border border-[var(--line-divider)] text-[var(--text-secondary)] hover:bg-[var(--btn-regular-bg)] transition-colors"
          >
            <Volume2 size={14} />
          </button>
        </div>
      </div>

      {/* Back face — revealed on flip */}
      {flipped ? (
        <div className="space-y-3 flex-1">
          {firstDefinition?.definition && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-[var(--deep-text)] leading-snug">
                {firstDefinition.definition}
              </p>
              {showAllMeanings && meanings.slice(1).map((m: unknown, i) => {
                const meaning = m as { partOfSpeech?: string; definitions?: { definition?: string }[] };
                return (
                  <div key={i} className="text-sm text-[var(--text-secondary)] border-t border-[var(--line-divider)] pt-1.5 mt-1.5">
                    {meaning.partOfSpeech && <span className="text-xs font-semibold uppercase mr-1">{meaning.partOfSpeech}</span>}
                    {meaning.definitions?.[0]?.definition}
                  </div>
                );
              })}
            </div>
          )}

          {firstDefinition?.example && (
            <div className="rounded-xl border border-dashed border-[var(--line-divider)] p-3">
              <p className="text-tiny font-semibold text-[var(--text-tertiary)] uppercase tracking-widest mb-1">Example</p>
              <p className="text-sm italic text-[var(--text-secondary)] leading-relaxed">
                "{firstDefinition.example}"
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-end">
          {firstDefinition?.example && (
            <div className="rounded-xl border border-dashed border-[var(--line-divider)] p-3 mb-3">
              <p className="text-tiny font-semibold text-[var(--text-tertiary)] uppercase tracking-widest mb-1">Fill in the blank</p>
              <p className="text-sm italic text-[var(--text-secondary)] leading-relaxed">
                "{blankOutWord(firstDefinition.example, entry.word ?? "")}"
              </p>
            </div>
          )}
          <p className="text-xs text-[var(--text-tertiary)]">
            press{" "}
            <kbd className="px-1.5 py-0.5 rounded border border-[var(--line-divider)] bg-[var(--btn-regular-bg)] text-tiny font-mono">space</kbd>
            {" "}to reveal answer
          </p>
        </div>
      )}
    </div>
  );
}

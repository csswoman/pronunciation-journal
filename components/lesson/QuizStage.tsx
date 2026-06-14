"use client";

// Planned structure:
// <QuizStage>
//   <QuizTimer />
//   <QuizCard>
//     <QuizPrompt /> (word, IPA, or audio button)
//     <OptionGrid /> (3 multiple-choice options)
//     <InlineFeedback /> (correct / wrong + explanation)
//   </QuizCard>
//   <QuizProgress /> (1 of 5 dots)
// </QuizStage>

import { useState, useEffect, useCallback } from "react";
import type { LessonWord } from "@/lib/types";

type QuizType = "audio_to_ipa" | "word_to_ipa" | "word_to_sentence";

interface QuizQuestion {
  type: QuizType;
  word: LessonWord;
  options: string[];
  correctIndex: number;
}

function buildQuestions(words: LessonWord[]): QuizQuestion[] {
  if (words.length === 0) return [];
  const pool = [...words];
  while (pool.length < 3) pool.push(...words); // ensure at least 3 for distractors

  const pick = (w: LessonWord, exclude: LessonWord[]): LessonWord =>
    pool.find((p) => p !== w && !exclude.includes(p)) ?? pool[0];

  const makeIpaOptions = (w: LessonWord): { options: string[]; correctIndex: number } => {
    const d1 = pick(w, []);
    const d2 = pick(w, [d1]);
    const opts = [w.ipa, d1.ipa, d2.ipa].filter(Boolean);
    // Shuffle
    const shuffled = [...opts].sort(() => Math.random() - 0.5);
    return { options: shuffled, correctIndex: shuffled.indexOf(w.ipa) };
  };

  const makeSentenceOptions = (w: LessonWord): { options: string[]; correctIndex: number } | null => {
    const hint = w.hint;
    if (!hint) return null;
    const d1 = pick(w, []);
    const d2 = pick(w, [d1]);
    const opts = [hint, d1.hint ?? d1.word, d2.hint ?? d2.word];
    const shuffled = [...opts].sort(() => Math.random() - 0.5);
    return { options: shuffled, correctIndex: shuffled.indexOf(hint) };
  };

  const questions: QuizQuestion[] = [];

  const types: QuizType[] = ["audio_to_ipa", "word_to_ipa", "word_to_sentence", "audio_to_ipa", "word_to_ipa"];
  const wordsForQ = [words[0], words[Math.min(1, words.length - 1)], words[Math.min(2, words.length - 1)], words[0], words[Math.min(1, words.length - 1)]];

  for (let i = 0; i < 5; i++) {
    const w = wordsForQ[i];
    const type = types[i];
    if (type === "word_to_sentence") {
      const sent = makeSentenceOptions(w);
      if (!sent) {
        const ipa = makeIpaOptions(w);
        questions.push({ type: "word_to_ipa", word: w, ...ipa });
        continue;
      }
      questions.push({ type, word: w, ...sent });
    } else {
      questions.push({ type, word: w, ...makeIpaOptions(w) });
    }
  }

  return questions;
}

const PROMPT_LABELS: Record<QuizType, string> = {
  audio_to_ipa: "Listen, then pick the IPA",
  word_to_ipa: "See the word, pick its IPA",
  word_to_sentence: "Pick the correct example sentence",
};

interface Props {
  words: LessonWord[];
  onComplete: (accuracy: number) => void;
}

export function QuizStage({ words, onComplete }: Props) {
  const [questions] = useState(() => buildQuestions(words));
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const q = questions[qIndex];

  const handleSelect = useCallback((optionIndex: number) => {
    if (selected !== null || !q) return;
    setSelected(optionIndex);
    if (optionIndex === q.correctIndex) setCorrect((c) => c + 1);

    setTimeout(() => {
      if (qIndex + 1 >= questions.length) {
        const acc = Math.round(((optionIndex === q.correctIndex ? correct + 1 : correct) / questions.length) * 100);
        onComplete(acc);
      } else {
        setQIndex((i) => i + 1);
        setSelected(null);
      }
    }, 900);
  }, [selected, q, qIndex, questions.length, correct, onComplete]);

  const playAudio = useCallback((url?: string | null) => {
    if (url) new Audio(url).play().catch(() => {});
  }, []);

  if (!q) return null;

  const timerMin = Math.floor(elapsed / 60).toString().padStart(2, "0");
  const timerSec = (elapsed % 60).toString().padStart(2, "0");

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
      {/* Timer + progress dots */}
      <div className="flex w-full items-center justify-between text-caption text-fg-muted">
        <span>{timerMin}:{timerSec}</span>
        <div className="flex gap-1.5">
          {questions.map((_, i) => (
            <span
              key={i}
              className="block h-2 w-2 rounded-full transition-colors"
              style={{
                background: i < qIndex ? "var(--primary)" : i === qIndex ? "var(--primary)" : "color-mix(in oklch, var(--primary) 20%, transparent)",
                opacity: i === qIndex ? 1 : i < qIndex ? 0.5 : 0.3,
              }}
            />
          ))}
        </div>
        <span className="text-fg-subtle">{qIndex + 1} / {questions.length}</span>
      </div>

      {/* Question card */}
      <div className="w-full rounded-2xl border border-border-subtle bg-surface-raised p-6 shadow-card space-y-5">
        <p className="text-tiny font-semibold uppercase tracking-widest text-fg-subtle">
          {PROMPT_LABELS[q.type]}
        </p>

        {/* Prompt */}
        {q.type === "audio_to_ipa" ? (
          <div className="text-center">
            <button
              onClick={() => playAudio(q.word.audioUrl)}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-body-sm font-medium text-on-primary hover:opacity-90 transition-opacity"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
              Play audio
            </button>
          </div>
        ) : (
          <p className="text-center text-[clamp(2rem,6vw,3rem)] font-semibold leading-none tracking-tight">
            {q.type === "word_to_sentence" ? q.word.word : q.word.word}
          </p>
        )}

        {/* Options */}
        <div className="grid gap-2">
          {q.options.map((opt, i) => {
            const isSelected = selected === i;
            const isCorrect = i === q.correctIndex;
            let bg = "bg-surface-sunken hover:bg-border-subtle";
            let border = "border-border-subtle";
            if (selected !== null) {
              if (isCorrect) { bg = "bg-[color-mix(in_oklch,var(--admonitions-color-tip)_12%,transparent)]"; border = "border-[color-mix(in_oklch,var(--admonitions-color-tip)_40%,transparent)]"; }
              else if (isSelected) { bg = "bg-[color-mix(in_oklch,var(--error)_10%,transparent)]"; border = "border-[color-mix(in_oklch,var(--error)_40%,transparent)]"; }
            }
            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                disabled={selected !== null}
                className={`w-full rounded-xl border px-4 py-3 text-left text-body-sm font-medium transition-colors ${bg} ${border}`}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {selected !== null && (
          <p
            className="text-center text-body-sm font-semibold"
            style={{ color: selected === q.correctIndex ? "var(--admonitions-color-tip)" : "var(--error)" }}
          >
            {selected === q.correctIndex ? "Correct!" : `Correct answer: ${q.options[q.correctIndex]}`}
          </p>
        )}
      </div>
    </div>
  );
}

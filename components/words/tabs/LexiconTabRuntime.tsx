"use client";

import Section from "@/components/layout/Section";
import { LexiconView } from "@/components/lexicon/LexiconView";
import type { LessonViewModel } from "@/lib/lexicon/types";
import type { WordsMode } from "@/components/words/WordsTopbar";

interface LexiconTabRuntimeProps {
  lexiconLessons: LessonViewModel[];
  lexiconLearned: number;
  lexiconInProgress: number;
  lexiconTotal: number;
  lexiconPercent: number;
  dueForReview?: number;
  dueWordLabels?: string[];
  progressUnavailable?: boolean;
  mode?: WordsMode;
}

export default function LexiconTabRuntime({
  lexiconLessons,
  lexiconLearned,
  lexiconInProgress,
  lexiconTotal,
  lexiconPercent,
  dueForReview = 0,
  dueWordLabels = [],
  progressUnavailable = false,
  mode = "dictionary",
}: LexiconTabRuntimeProps) {
  return (
    <Section spacing="md">
      <LexiconView
        lessons={lexiconLessons}
        lexiconTotal={lexiconTotal}
        lexiconLearned={lexiconLearned}
        lexiconInProgress={lexiconInProgress}
        lexiconPercent={lexiconPercent}
        dueForReview={dueForReview}
        dueWordLabels={dueWordLabels}
        progressUnavailable={progressUnavailable}
        mode={mode}
      />
    </Section>
  );
}

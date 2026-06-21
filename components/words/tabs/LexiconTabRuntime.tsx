"use client";

import Section from "@/components/layout/Section";
import { LexiconView } from "@/components/lexicon/LexiconView";
import type { LessonViewModel } from "@/lib/lexicon/types";

interface LexiconTabRuntimeProps {
  lexiconLessons: LessonViewModel[];
  lexiconLearned: number;
  lexiconInProgress: number;
  lexiconTotal: number;
  lexiconPercent: number;
  dueForReview?: number;
  dueWordLabels?: string[];
}

export default function LexiconTabRuntime({
  lexiconLessons,
  lexiconLearned,
  lexiconInProgress,
  lexiconTotal,
  lexiconPercent,
  dueForReview = 0,
  dueWordLabels = [],
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
      />
    </Section>
  );
}

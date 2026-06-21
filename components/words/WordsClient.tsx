"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import PageLayout from "@/components/layout/PageLayout";
import { type WordsTabId, WordsTopbar } from "@/components/words/WordsTopbar";
import type { LessonViewModel } from "@/lib/lexicon/types";

const LexiconTabRuntime = dynamic(() => import("./tabs/LexiconTabRuntime"), {
  loading: () => <WordsRuntimeSkeleton />,
});
const MyWordsTabRuntime = dynamic(() => import("./tabs/MyWordsTabRuntime"), {
  loading: () => <WordsRuntimeSkeleton />,
});
const DecksTabRuntime = dynamic(() => import("./tabs/DecksTabRuntime"), {
  loading: () => <WordsRuntimeSkeleton />,
});

interface WordsClientProps {
  lexiconLessons: LessonViewModel[];
  lexiconLearned: number;
  lexiconInProgress: number;
  lexiconTotal: number;
  lexiconPercent: number;
  myWordsCount: number;
  deckCount: number;
  dueForReview?: number;
  dueWordLabels?: string[];
}

const TAB_IDS: WordsTabId[] = ["lexicon", "my-words", "decks"];

function normalizeTab(tab: string | null): WordsTabId {
  return TAB_IDS.includes(tab as WordsTabId) ? (tab as WordsTabId) : "lexicon";
}

function WordsRuntimeSkeleton() {
  return (
    <div className="space-y-4">
      <div className="words-lexicon__contextbar">
        <div className="shimmer h-5 w-48 rounded-full bg-surface-sunken" />
        <div className="shimmer h-9 w-28 rounded-full bg-surface-sunken" />
      </div>
      <div className="space-y-3">
        <div className="shimmer h-20 rounded-2xl bg-surface-sunken" />
        <div className="shimmer h-20 rounded-2xl bg-surface-sunken" />
        <div className="shimmer h-20 rounded-2xl bg-surface-sunken" />
      </div>
    </div>
  );
}

export function WordsClient({
  lexiconLessons,
  lexiconLearned,
  lexiconInProgress,
  lexiconTotal,
  lexiconPercent,
  myWordsCount: initialMyWordsCount,
  deckCount: initialDeckCount,
  dueForReview = 0,
  dueWordLabels = [],
}: WordsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const normalizedTab = useMemo(() => normalizeTab(tabParam), [tabParam]);
  const [activeTab, setActiveTab] = useState<WordsTabId>(normalizedTab);
  const [myWordsCount, setMyWordsCount] = useState(initialMyWordsCount);
  const [deckCount, setDeckCount] = useState(initialDeckCount);

  useEffect(() => {
    setMyWordsCount(initialMyWordsCount);
  }, [initialMyWordsCount]);

  useEffect(() => {
    setDeckCount(initialDeckCount);
  }, [initialDeckCount]);

  useEffect(() => {
    if (normalizedTab !== activeTab) {
      setActiveTab(normalizedTab);
    }
  }, [normalizedTab, activeTab]);

  const handleTabChange = (tab: WordsTabId) => {
    setActiveTab(tab);
    router.replace(`/words?tab=${tab}`, { scroll: false });
  };

  return (
    <PageLayout cardWrapper={false}>
      <div className="words-lexicon">
        <WordsTopbar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          lexiconCount={lexiconTotal}
          myWordsCount={myWordsCount}
          deckCount={deckCount}
        />

        {activeTab === "lexicon" && (
          <LexiconTabRuntime
            lexiconLessons={lexiconLessons}
            lexiconLearned={lexiconLearned}
            lexiconInProgress={lexiconInProgress}
            lexiconTotal={lexiconTotal}
            lexiconPercent={lexiconPercent}
            dueForReview={dueForReview}
            dueWordLabels={dueWordLabels}
          />
        )}

        {activeTab === "my-words" && (
          <MyWordsTabRuntime
            deckCount={deckCount}
            onMyWordsCountChange={setMyWordsCount}
            onDeckCountChange={setDeckCount}
            onTabChange={handleTabChange}
          />
        )}

        {activeTab === "decks" && (
          <DecksTabRuntime
            onDeckCountChange={setDeckCount}
          />
        )}
      </div>
    </PageLayout>
  );
}

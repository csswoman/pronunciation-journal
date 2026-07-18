"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "@/components/icons";

import PageLayout from "@/components/layout/PageLayout";
import PageHeader from "@/components/layout/PageHeader";
import { type WordsTabId, WordsTopbar } from "@/components/words/WordsTopbar";
import type { LessonViewModel } from "@/lib/lexicon/types";

const LexiconTabRuntime = dynamic(() => import("./tabs/LexiconTabRuntime"), {
  loading: () => <WordsRuntimeSkeleton />,
});
const MyWordsTabRuntime = dynamic(() => import("./tabs/MyWordsTabRuntime"), {
  loading: () => <WordsRuntimeSkeleton />,
});

interface WordsClientProps {
  lexiconLessons: LessonViewModel[];
  lexiconLearned: number;
  lexiconInProgress: number;
  lexiconTotal: number;
  lexiconPercent: number;
  myWordsCount: number;
  /** Retained at the route boundary while deck management lives in /practice/decks. */
  deckCount: number;
  dueForReview?: number;
  dueWordLabels?: string[];
}

const TAB_IDS: WordsTabId[] = ["lexicon", "my-words"];

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
  dueForReview = 0,
  dueWordLabels = [],
}: WordsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const normalizedTab = useMemo(() => normalizeTab(tabParam), [tabParam]);
  const [activeTab, setActiveTab] = useState<WordsTabId>(normalizedTab);
  const [myWordsCount, setMyWordsCount] = useState(initialMyWordsCount);
  const primaryActionRef = useRef<() => void>(() => {});

  const registerPrimaryAction = useCallback((action: () => void) => {
    primaryActionRef.current = action;
  }, []);

  const primaryCta = useMemo(() => {
    if (activeTab === "my-words") {
      return {
        label: "Nueva palabra",
        icon: <Plus size={15} aria-hidden />,
        onClick: () => primaryActionRef.current(),
      };
    }
    return undefined;
  }, [activeTab]);

  useEffect(() => {
    setMyWordsCount(initialMyWordsCount);
  }, [initialMyWordsCount]);

  useEffect(() => {
    if (normalizedTab !== activeTab) {
      setActiveTab(normalizedTab);
    }
  }, [normalizedTab, activeTab]);

  const handleTabChange = useCallback((tab: WordsTabId) => {
    setActiveTab(tab);
    router.replace(`/words?tab=${tab}`, { scroll: false });
  }, [router]);

  return (
    <PageLayout>
      <div className="words-lexicon">
        <PageHeader
          kicker="Reference"
          title="Words"
          subtitle="Tu colección y léxico para repasar y ampliar vocabulario."
          primaryCta={primaryCta}
        />
        <WordsTopbar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          lexiconCount={lexiconTotal}
          myWordsCount={myWordsCount}
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
            onMyWordsCountChange={setMyWordsCount}
            onRegisterPrimaryAction={registerPrimaryAction}
          />
        )}

      </div>
    </PageLayout>
  );
}

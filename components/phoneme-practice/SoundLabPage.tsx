"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight } from "@/components/icons";
import PageLayout from "@/components/layout/PageLayout";
import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
import dynamic from "next/dynamic";
import { SoundLabFilterRow } from "./SoundLabFilterRow";
import { SoundLabLessonGrid } from "./SoundLabLessonGrid";
import type { LessonSection } from "./SoundLabLessonGrid";
import { useSoundLabData } from "@/hooks/useSoundLabData";
import type { Lesson } from "@/lib/types";
import { ipaFromLessonTitle } from "@/lib/sound-lab/display";
import { useDialogFocus } from "@/hooks/useDialogFocus";
import { useSoundLabWorkspace } from "@/hooks/useSoundLabWorkspace";
import { SoundLabFocusBanner } from "./SoundLabFocusBanner";
import { SoundLabDetailDialog } from "./SoundLabDetailDialog";
import { SoundsWorkspaceTabs } from "./SoundsWorkspaceTabs";
import { SoundLabRecommendedPractice } from "./SoundLabRecommendedPractice";
import type { SoundLabPhraseCandidate } from "@/lib/sound-lab/recommended-phrase";
import { useSoundLabPhraseRecommendation } from "@/hooks/useSoundLabPhraseRecommendation";

const MinimalPairsWorkspace = dynamic(() => import("./MinimalPairsWorkspace"), {
  loading: () => <div className="p-8 text-center text-fg-muted font-caption">Cargando pares mínimos…</div>,
});
const IntonationTrainer = dynamic(
  () => import("@/components/pronunciation/IntonationTrainer").then((m) => m.IntonationTrainer),
  { loading: () => <div className="p-8 text-center text-fg-muted font-caption">Cargando entonación…</div> },
);
const PronunciationPathPage = dynamic(
  () => import("@/components/courses/pronunciation-path/PronunciationPathPage").then((m) => m.PronunciationPathPage),
  { loading: () => <div className="p-8 text-center text-fg-muted font-caption">Cargando ruta de pronunciación…</div> },
);
import {
  buildLessonSections,
  continueCtaLabel,
  lessonMatchesSearch,
  matchesFocus,
  matchesHardFilter,
  matchesProgressFilter,
  soundLabHeaderCopy,
  type SoundLabGrouping,
  type SoundLabProgressFilter,
} from "./sound-lab-page-helpers";
import {
  CANONICAL_SOUND_COUNT,
  getCanonicalSound,
} from "@/lib/sounds/inventory";

interface SoundLabPageProps {
  userId?: string;
  phraseCandidates: SoundLabPhraseCandidate[];
}

export default function SoundLabPage({ userId, phraseCandidates }: SoundLabPageProps) {
  const router = useRouter();
  const { allLessons, soundProgressMap, inProgressCount, heroLesson, isLoading } =
    useSoundLabData();

  const searchParams = useSearchParams();
  const {
    activeTab,
    isSoundsView,
    isMinimalPairsView,
    isIntonationView,
    isPathView,
    selectTab,
  } = useSoundLabWorkspace();
  const focusTokens = useMemo(() => {
    const raw = searchParams.get("focus");
    return raw ? raw.split(",").map((s) => s.trim()).filter(Boolean) : [];
  }, [searchParams]);

  const [groupBy, setGroupBy] = useState<SoundLabGrouping>("impact");
  const [categoryFilter, setCategoryFilter] = useState<"impact" | "vowel" | "consonant">("impact");
  const [progressFilter, setProgressFilter] = useState<SoundLabProgressFilter>("all");
  const [onlyHard, setOnlyHard] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const closeDetail = useCallback(() => setSelectedLesson(null), []);
  const { dialogRef: detailDialogRef, captureTrigger } = useDialogFocus<HTMLDivElement>(
    selectedLesson !== null,
    closeDetail,
  );

  const handleSelectLesson = useCallback((lesson: Lesson) => {
    captureTrigger();
    setSelectedLesson(lesson);
  }, [captureTrigger]);

  const focusSection = useMemo<LessonSection | null>(() => {
    if (focusTokens.length === 0) return null;
    const lessons = allLessons.filter((l) => matchesFocus(l, focusTokens));
    if (lessons.length === 0) return null;
    return {
      id: "focus",
      title: `Sonidos de tu lección · ${focusTokens.join(" · ")}`,
      count: lessons.length,
      lessons,
    };
  }, [allLessons, focusTokens]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allLessons.filter((lesson) => {
      if (categoryFilter === "vowel") {
        const ipa = ipaFromLessonTitle(lesson.title);
        const canonical = ipa ? getCanonicalSound(ipa) : undefined;
        if (canonical && canonical.type !== "vowel" && canonical.type !== "diphthong") return false;
      } else if (categoryFilter === "consonant") {
        const ipa = ipaFromLessonTitle(lesson.title);
        const canonical = ipa ? getCanonicalSound(ipa) : undefined;
        if (canonical && canonical.type !== "consonant") return false;
      }
      if (!matchesProgressFilter(lesson, progressFilter, soundProgressMap)) return false;
      if (onlyHard && !matchesHardFilter(lesson)) return false;
      return lessonMatchesSearch(lesson, q);
    });
  }, [allLessons, categoryFilter, progressFilter, onlyHard, soundProgressMap, search]);

  const sections = useMemo<LessonSection[]>(() => {
    return buildLessonSections(filtered, groupBy);
  }, [filtered, groupBy]);

  const phraseRecommendation = useSoundLabPhraseRecommendation(
    phraseCandidates, heroLesson.lesson, soundProgressMap,
  );

  function handleResume() {
    if (!heroLesson.lesson?.href) return;
    router.push(heroLesson.lesson.href);
  }

  function handleClearFilters() {
    setCategoryFilter("impact");
    setGroupBy("impact");
    setProgressFilter("all");
    setOnlyHard(false);
    setSearch("");
  }

  const selectedPhoneme = selectedLesson
    ? getCanonicalSound(ipaFromLessonTitle(selectedLesson.title) ?? "")
    : undefined;
  const selectedProgress = selectedPhoneme
    ? soundProgressMap.get(selectedPhoneme.symbol)
    : undefined;

  const header = soundLabHeaderCopy(
    activeTab, inProgressCount, CANONICAL_SOUND_COUNT, groupBy,
  );

  return (
    <PageLayout archetype="catalog" className="sound-lab min-h-screen">
      <header className="sound-lab__page-header space-y-5">
        <PageHeader
          kicker={header.kicker}
          title={header.title}
          actions={
            <div className="flex w-full flex-col sm:w-auto sm:flex-row items-stretch sm:items-center gap-3">
              <SoundsWorkspaceTabs
                activeTab={activeTab}
                onTabChange={selectTab}
              />
              {heroLesson.lesson && isSoundsView ? (
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleResume}
                  className="rounded-full px-5 py-2 font-semibold inline-flex items-center justify-center gap-2 cursor-pointer shadow-xs whitespace-nowrap active:scale-95 transition-all bg-primary text-on-primary"
                >
                  <span>{continueCtaLabel(heroLesson.lesson)}</span>
                  <ArrowRight size={14} className="stroke-[2.5]" aria-hidden />
                </Button>
              ) : null}
            </div>
          }
        />

        {isSoundsView && phraseRecommendation ? (
          <SoundLabRecommendedPractice
            recommendation={phraseRecommendation}
            onStart={() => router.push(
              `/practice/chunks?chunk=${encodeURIComponent(phraseRecommendation.id)}&focus=pronunciation`,
            )}
          />
        ) : null}

        {isSoundsView ? (
          <SoundLabFilterRow
            groupBy={groupBy}
            categoryFilter={categoryFilter}
            progressFilter={progressFilter}
            onlyHard={onlyHard}
            search={search}
            onGroupByChange={setGroupBy}
            onCategoryFilterChange={setCategoryFilter}
            onProgressFilterChange={setProgressFilter}
            onOnlyHardChange={setOnlyHard}
            onSearchChange={setSearch}
          />
        ) : null}

        {isSoundsView && focusTokens.length > 0 ? (
          <SoundLabFocusBanner focusTokens={focusTokens} focusSection={focusSection} />
        ) : null}
      </header>

      {isMinimalPairsView ? (
        <MinimalPairsWorkspace />
      ) : isIntonationView ? (
        <IntonationTrainer />
      ) : isPathView ? (
        <PronunciationPathPage
          userId={userId}
          initialTargetId={searchParams.get("target") ?? undefined}
          initialStage={searchParams.get("stage") ?? undefined}
        />
      ) : (
        <SoundLabLessonGrid
          sections={focusSection ? [focusSection, ...sections] : sections}
          heroLessonId={heroLesson.lesson?.id}
          soundProgressMap={soundProgressMap}
          isLoading={isLoading}
          onClearFilters={handleClearFilters}
          onSelect={handleSelectLesson}
        />
      )}

      {isSoundsView && selectedLesson && selectedPhoneme ? (
        <SoundLabDetailDialog
          dialogRef={detailDialogRef}
          phoneme={selectedPhoneme}
          lesson={selectedLesson}
          progressPct={selectedProgress ?? 0}
          isWeak={selectedProgress !== undefined && selectedProgress < 60}
          isContinuing={selectedLesson.id === heroLesson.lesson?.id}
          practiceHref={selectedLesson.href ?? `/practice/sounds/sound/${selectedLesson.id.replace("sound-", "")}`}
          onPractice={() => {
            const targetHref =
              selectedLesson.href ??
              `/practice/sounds/sound/${selectedLesson.id.replace("sound-", "")}`;
            closeDetail();
            router.push(targetHref);
          }}
          onClose={closeDetail}
        />
      ) : null}

    </PageLayout>
  );
}

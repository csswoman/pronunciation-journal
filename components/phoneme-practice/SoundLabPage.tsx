"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Play } from "@/components/icons";
import PageLayout from "@/components/layout/PageLayout";
import PageHeader from "@/components/layout/PageHeader";
import dynamic from "next/dynamic";
import { SoundLabFilterRow } from "./SoundLabFilterRow";
import { EarAndVoiceHero } from "./EarAndVoiceHero";
import { SoundLabLessonGrid } from "./SoundLabLessonGrid";
import type { LessonSection } from "./SoundLabLessonGrid";
import { useSoundLabData } from "@/hooks/useSoundLabData";
import type { SoundLabChip } from "./SoundLabFilterRow";
import type { Lesson } from "@/lib/types";
import { ipaFromLessonTitle } from "@/lib/sound-lab/display";
import { useDialogFocus } from "@/hooks/useDialogFocus";
import { useSoundLabWorkspace } from "@/hooks/useSoundLabWorkspace";
import { SoundsWorkspaceTabs } from "./SoundsWorkspaceTabs";
import { SoundLabFocusBanner } from "./SoundLabFocusBanner";
import { SoundLabDetailDialog } from "./SoundLabDetailDialog";

const MinimalPairsWorkspace = dynamic(() => import("./MinimalPairsWorkspace"), {
  loading: () => <div className="p-8 text-center text-fg-muted font-caption">Cargando pares mínimos…</div>,
});
const PronunciationPathPage = dynamic(
  () => import("@/components/courses/pronunciation-path/PronunciationPathPage").then((m) => m.PronunciationPathPage),
  { loading: () => <div className="p-8 text-center text-fg-muted font-caption">Cargando ruta de pronunciación…</div> },
);
const IPAReferenceDialog = dynamic(
  () => import("./IPAReferenceDialog").then((m) => m.IPAReferenceDialog),
  { ssr: false },
);
import {
  ALL_GROUP_SECTIONS,
  continueCtaLabel,
  headerStatsLine,
  lessonMatchesSearch,
  matchesDifficultyChip,
  matchesFocus,
  resolveGroupId,
} from "./sound-lab-page-helpers";
import {
  CANONICAL_SOUND_COUNT,
  getCanonicalSound,
} from "@/lib/sounds/inventory";

interface SoundLabPageProps {
  userId?: string;
}

export default function SoundLabPage({ userId }: SoundLabPageProps) {
  const router = useRouter();
  const { allLessons, soundProgressMap, inProgressCount, heroLesson, isLoading } =
    useSoundLabData();

  const searchParams = useSearchParams();
  const {
    activeTab,
    isSoundsView,
    isMinimalPairsView,
    isPathView,
    isIPAOpen,
    selectTab,
    openIPA,
    closeIPA,
  } = useSoundLabWorkspace();
  const focusTokens = useMemo(() => {
    const raw = searchParams.get("focus");
    return raw ? raw.split(",").map((s) => s.trim()).filter(Boolean) : [];
  }, [searchParams]);

  const [activeChip, setActiveChip] = useState<SoundLabChip>("all");
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
      if (!matchesDifficultyChip(lesson, activeChip)) return false;
      return lessonMatchesSearch(lesson, q);
    });
  }, [allLessons, activeChip, search]);

  const sections = useMemo<LessonSection[]>(() => {
    if (filtered.length === 0) return [];

    if (activeChip !== "all") {
      return [
        {
          id: activeChip,
          title: "",
          count: filtered.length,
          lessons: filtered,
        },
      ];
    }

    const buckets = new Map<string, Lesson[]>(
      ALL_GROUP_SECTIONS.map((g) => [g.id, []]),
    );

    for (const lesson of filtered) {
      const groupId = resolveGroupId(lesson);
      const list = buckets.get(groupId) ?? buckets.get("consonant")!;
      list.push(lesson);
      buckets.set(groupId, list);
    }

    return ALL_GROUP_SECTIONS.map((g) => ({
      id: g.id,
      title: g.title,
      count: buckets.get(g.id)?.length ?? 0,
      lessons: buckets.get(g.id) ?? [],
    })).filter((s) => s.lessons.length > 0);
  }, [filtered, activeChip]);

  function handleResume() {
    if (!heroLesson.lesson?.href) return;
    router.push(heroLesson.lesson.href);
  }

  function handleClearFilters() {
    setActiveChip("all");
    setSearch("");
  }

  const selectedPhoneme = selectedLesson
    ? getCanonicalSound(ipaFromLessonTitle(selectedLesson.title) ?? "")
    : undefined;
  const selectedProgress = selectedPhoneme
    ? soundProgressMap.get(selectedPhoneme.symbol)
    : undefined;

  return (
    <PageLayout archetype="catalog" className="sound-lab min-h-screen">
      <header className="sound-lab__page-header">
        <PageHeader
          kicker="Práctica"
          title="Laboratorio de sonidos"
          subtitle={headerStatsLine(inProgressCount, CANONICAL_SOUND_COUNT)}
          primaryCta={
            isSoundsView && heroLesson.lesson
              ? {
                  label: continueCtaLabel(heroLesson.lesson),
                  icon: <Play size={14} className="fill-current" aria-hidden />,
                  onClick: handleResume,
                }
              : undefined
          }
        />

        <SoundsWorkspaceTabs
          activeTab={activeTab}
          onTabChange={selectTab}
          onOpenIPA={openIPA}
        />

        {isSoundsView ? (
          <>
            <EarAndVoiceHero
              onSelectMinimalPairs={(contrastId) => {
                if (contrastId) {
                  router.push(`/practice/sounds?tab=minimal-pairs&contrast=${encodeURIComponent(contrastId)}`);
                } else {
                  selectTab("minimal-pairs");
                }
              }}
              onOpenIPA={openIPA}
            />
            <SoundLabFilterRow
              activeChip={activeChip}
              search={search}
              resultCount={filtered.length}
              onChipChange={setActiveChip}
              onSearchChange={setSearch}
              onClearFilters={handleClearFilters}
            />
          </>
        ) : null}

        {isSoundsView && focusTokens.length > 0 ? (
          <SoundLabFocusBanner focusTokens={focusTokens} focusSection={focusSection} />
        ) : null}
      </header>

      {isMinimalPairsView ? (
        <MinimalPairsWorkspace />
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
          practiceHref={selectedLesson.href ?? "/practice/sounds"}
          onPractice={() => router.push(selectedLesson.href ?? "/practice/sounds")}
          onClose={closeDetail}
        />
      ) : null}

      {isIPAOpen && <IPAReferenceDialog open={isIPAOpen} onClose={closeIPA} lessons={allLessons} />}
    </PageLayout>
  );
}

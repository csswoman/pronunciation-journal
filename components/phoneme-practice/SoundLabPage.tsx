"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Play } from "@/components/icons";
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
const IPAReferenceDialog = dynamic(
  () => import("./IPAReferenceDialog").then((m) => m.IPAReferenceDialog),
  { ssr: false },
);
import {
  ALL_GROUP_SECTIONS,
  continueCtaLabel,
  headerStatsLine,
  lessonMatchesSearch,
  matchesFocus,
  matchesHardFilter,
  matchesProgressFilter,
  resolveGroupId,
  type SoundLabProgressFilter,
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
    isIntonationView,
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
      if (!matchesProgressFilter(lesson, progressFilter, soundProgressMap)) return false;
      if (onlyHard && !matchesHardFilter(lesson)) return false;
      return lessonMatchesSearch(lesson, q);
    });
  }, [allLessons, progressFilter, onlyHard, soundProgressMap, search]);

  const sections = useMemo<LessonSection[]>(() => {
    if (filtered.length === 0) return [];

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
  }, [filtered]);

  function handleResume() {
    if (!heroLesson.lesson?.href) return;
    router.push(heroLesson.lesson.href);
  }

  function handleClearFilters() {
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

  const headerKicker = isPathView
    ? "Práctica · Ruta"
    : isMinimalPairsView
      ? "Práctica · Pares mínimos"
      : isIntonationView
        ? "Práctica · Entonación"
        : "Práctica";

  const headerTitle = isPathView
    ? "Ruta de pronunciación"
    : isMinimalPairsView
      ? "Entrenamiento de pares mínimos"
      : isIntonationView
        ? "Entrenador de entonación"
        : "Laboratorio de sonidos";

  const headerSubtitle = isPathView
    ? "De sonidos a frases reales. Un paso claro a la vez."
    : isMinimalPairsView
      ? "Entrena tu oído para distinguir diferencias sutiles entre sonidos similares en inglés."
      : isIntonationView
        ? "Practica el ritmo, la melodía y el tono natural del inglés hablado."
        : headerStatsLine(inProgressCount, CANONICAL_SOUND_COUNT);

  return (
    <PageLayout archetype="catalog" className="sound-lab min-h-screen">
      <header className="sound-lab__page-header">
        <PageHeader
          kicker={headerKicker}
          title={headerTitle}
          subtitle={headerSubtitle}
          actions={
            <SoundsWorkspaceTabs
              activeTab={activeTab}
              onTabChange={selectTab}
              onOpenIPA={openIPA}
            />
          }
        />

        {isSoundsView ? (
          <SoundLabFilterRow
            progressFilter={progressFilter}
            onlyHard={onlyHard}
            search={search}
            onProgressFilterChange={setProgressFilter}
            onOnlyHardChange={setOnlyHard}
            onSearchChange={setSearch}
            resumeAction={
              heroLesson.lesson ? (
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleResume}
                  className="rounded-xl px-4 py-2 font-semibold inline-flex items-center gap-2 cursor-pointer shadow-xs whitespace-nowrap active:scale-95 transition-all"
                >
                  <Play size={13} className="stroke-[2.5]" aria-hidden />
                  <span>{continueCtaLabel(heroLesson.lesson)}</span>
                </Button>
              ) : undefined
            }
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

      {isIPAOpen && <IPAReferenceDialog open={isIPAOpen} onClose={closeIPA} lessons={allLessons} />}
    </PageLayout>
  );
}

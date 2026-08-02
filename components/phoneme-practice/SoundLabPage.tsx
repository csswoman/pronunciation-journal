"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Headphones, Play } from "@/components/icons";
import PageLayout from "@/components/layout/PageLayout";
import PageHeader from "@/components/layout/PageHeader";
import { SoundDetail } from "@/components/sounds/SoundDetail";
import MinimalPairsWorkspace from "./MinimalPairsWorkspace";
import { PronunciationPathPage } from "@/components/courses/pronunciation-path/PronunciationPathPage";
import { SoundLabFilterRow } from "./SoundLabFilterRow";
import { SoundLabLessonGrid } from "./SoundLabLessonGrid";
import type { LessonSection } from "./SoundLabLessonGrid";
import { useSoundLabData } from "@/hooks/useSoundLabData";
import type { SoundLabChip } from "./SoundLabFilterRow";
import type { Lesson } from "@/lib/types";
import { ipaFromLessonTitle } from "@/lib/sound-lab/display";
import { useDialogFocus } from "@/hooks/useDialogFocus";
import { useSoundLabWorkspace } from "@/hooks/useSoundLabWorkspace";
import { SoundsWorkspaceTabs } from "./SoundsWorkspaceTabs";
import { IPAReferenceDialog } from "./IPAReferenceDialog";
import {
  CANONICAL_SOUND_COUNT,
  getCanonicalSound,
} from "@/lib/sounds/inventory";

const ALL_GROUP_SECTIONS = [
  { id: "vowel", title: "Vocales" },
  { id: "diphthong", title: "Diptongos" },
  { id: "consonant", title: "Consonantes" },
] as const;

function getLessonSectionId(lesson: Lesson): string {
  return getCanonicalSound(ipaFromLessonTitle(lesson.title) ?? "")?.type ?? "consonant";
}

function matchesDifficultyChip(lesson: Lesson, chip: SoundLabChip): boolean {
  if (chip === "all") return true;
  return lesson.difficulty === chip;
}

function resolveGroupId(lesson: Lesson): string {
  return getLessonSectionId(lesson);
}

function headerStatsLine(inProgressCount: number, totalCount: number): string {
  if (inProgressCount > 0) {
    return `${inProgressCount} de ${totalCount} sonidos en curso`;
  }
  if (totalCount === 1) {
    return "1 sonido listo para practicar";
  }
  return `${totalCount} sonidos listos para practicar`;
}

function continueCtaLabel(lesson: Lesson | null): string {
  const ipa = lesson ? ipaFromLessonTitle(lesson.title) : null;
  if (ipa) return `Continuar ${ipa}`;
  return "Continuar lección";
}

/** True when a lesson teaches any of the focused IPA symbols (from a course handoff). */
function matchesFocus(lesson: Lesson, tokens: string[]): boolean {
  if (tokens.length === 0) return false;
  const title = lesson.title.toLowerCase();
  return tokens.some((t) => {
    const tok = t.toLowerCase();
    if (title.includes(tok)) return true;
    return lesson.words?.some((w) => w.ipa?.toLowerCase().includes(tok)) ?? false;
  });
}

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
      if (!q) return true;
      if (lesson.title.toLowerCase().includes(q)) return true;
      if (lesson.description.toLowerCase().includes(q)) return true;
      const ipa = lesson.title.match(/^\/+([^/]+)\/+/)?.[1]?.toLowerCase();
      if (ipa && ipa.includes(q.replaceAll("/", ""))) return true;
      return (
        lesson.words?.some((w) => {
          if (w.word?.toLowerCase().includes(q)) return true;
          if (w.ipa?.toLowerCase().includes(q)) return true;
          return false;
        }) ?? false
      );
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
          <SoundLabFilterRow
            activeChip={activeChip}
            search={search}
            resultCount={filtered.length}
            onChipChange={setActiveChip}
            onSearchChange={setSearch}
            onClearFilters={handleClearFilters}
          />
        ) : null}

        {isSoundsView && focusTokens.length > 0 && (
          <div
            className="sound-lab__focus-banner flex flex-wrap items-center gap-2 rounded-xl border px-4 py-3"
            role="status"
          >
            <Headphones size={14} className="sound-lab__focus-banner-icon shrink-0" aria-hidden />
            <span className="min-w-0 flex-1 text-body-sm text-[color:var(--text-secondary)]">
              Enfoque:{" "}
              <span className="sound-lab__focus-tokens font-ipa">{focusTokens.join(" · ")}</span>
              {!focusSection && (
                <span className="text-[color:var(--text-secondary)]">
                  . Aún no hay lecciones que coincidan.
                </span>
              )}
            </span>
            {focusSection?.lessons[0]?.href ? (
              <Link
                href={focusSection.lessons[0].href}
                className="inline-flex min-h-9 shrink-0 items-center rounded-md bg-[var(--cta-bg)] px-3 text-caption font-semibold text-[var(--cta-fg)]"
              >
                Abrir este sonido
              </Link>
            ) : null}
            <Link
              href="/practice/sounds"
              className="sound-lab__focus-banner-link shrink-0 text-caption hover:underline"
            >
              Ver todos
            </Link>
          </div>
        )}
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
        <div
          className="sound-lab__detail-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedLesson(null);
          }}
        >
          <div
            ref={detailDialogRef}
            className="sound-lab__detail-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sound-detail-dialog-title"
            tabIndex={-1}
          >
            <SoundDetail
              phoneme={selectedPhoneme}
              titleId="sound-detail-dialog-title"
              lesson={selectedLesson}
              progressPct={selectedProgress ?? 0}
              isWeak={selectedProgress !== undefined && selectedProgress < 60}
              isContinuing={selectedLesson.id === heroLesson.lesson?.id}
              practiceHref={selectedLesson.href ?? "/practice/sounds"}
              onPractice={() => router.push(selectedLesson.href ?? "/practice/sounds")}
              onClose={closeDetail}
              descriptionId="sound-detail-dialog-description"
              className="sound-lab__detail-sheet"
            />
          </div>
        </div>
      ) : null}

      <IPAReferenceDialog open={isIPAOpen} onClose={closeIPA} lessons={allLessons} />
    </PageLayout>
  );
}

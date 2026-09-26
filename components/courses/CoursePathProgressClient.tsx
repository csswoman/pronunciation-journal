"use client";

/*
 * Planned subcomponents:
 * - CoursePathProgressClient (client coordinator for course path progress)
 *   - ProgressLoadingState (WordCarousel loader)
 *   - ProgressErrorBanner (offline / dexie error banner)
 *   - ProgressLevelHead (level title heading)
 *   - ProgressCtaSection (start here / resume next lesson)
 *   - UnitAccordionList (list of course path units with 3-state summary rows)
 *     - CoursePathOptionalCard (collapsible card for optional course units)
 *     - CoursePathMainCard (main card container for core unit lessons)
 *   - CoursePathYaPuedesDecirEsto (inline achievement block for real-world phrases)
 *   - CoursePracticeSuggestions (footer review suggestions)
 *   - CoursePathC1Electives (optional post-C1 elective tracks list)
 *   - CoursePathAsideProgress (sidebar progress dashboard)
 */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import CoursePathAsideProgress from "@/components/courses/CoursePathAsideProgress";
import CoursePathC1Electives from "@/components/courses/CoursePathC1Electives";
import CoursePathHeroBanner from "@/components/courses/CoursePathHeroBanner";
import CoursePathLessonRow from "@/components/courses/CoursePathLessonRow";
import CoursePathMainCard from "@/components/courses/CoursePathMainCard";
import CoursePathOptionalCard from "@/components/courses/CoursePathOptionalCard";
import CoursePathSearch from "@/components/courses/CoursePathSearch";
import CoursePathYaPuedesDecirEsto from "@/components/courses/CoursePathYaPuedesDecirEsto";
import CoursePracticeSuggestions from "@/components/courses/CoursePracticeSuggestions";
import { WordCarousel } from "@/components/practice/session/WordCarousel";
import { useLoadingWords } from "@/hooks/useLoadingWords";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { useLearnerLevelId } from "@/hooks/useLearnerLevelId";
import { deriveLevelView, lessonProgressKey, type DerivedUnitView } from "@/lib/courses/progress";
import type { CefrLevelId, CoursePathLevel, CoursePathTrackId } from "@/lib/courses/types";
import type { ImmersionLesson } from "@/lib/immersion/types";
import { cn } from "@/lib/cn";

interface CoursePathProgressClientProps {
  level: CoursePathLevel;
  compactHead?: boolean;
  hideAside?: boolean;
  hideHero?: boolean;
  hideSearch?: boolean;
  electiveTracks?: CoursePathLevel[];
  topicImmersionMap?: Record<string, ImmersionLesson>;
}

async function getOptionalUserId(): Promise<string | null> {
  try {
    const user = await getCurrentUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

function completionKey(userId: string, courseSlug: string, lessonSlug: string): string {
  return `${userId}:${courseSlug}:${lessonSlug}`;
}

export default function CoursePathProgressClient({
  level,
  compactHead,
  hideAside,
  hideHero,
  hideSearch,
  electiveTracks,
  topicImmersionMap,
}: CoursePathProgressClientProps) {
  const loadingWords = useLoadingWords();
  const [completedIds, setCompletedIds] = useState<Set<string> | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const navigatedLevelId = level.id as CefrLevelId;
  const learnerLevelId = useLearnerLevelId(navigatedLevelId);
  const isNavigatingOwnLevel = learnerLevelId === navigatedLevelId;

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(`course-path:groups:${level.id}`);
      setExpandedGroups(saved ? (JSON.parse(saved) as Record<string, boolean>) : {});
    } catch {
      setExpandedGroups({});
    }
  }, [level.id]);

  const handleGroupToggle = (id: string, open: boolean) => {
    setExpandedGroups((previous) => {
      const next = { ...previous, [id]: open };
      try {
        window.localStorage.setItem(`course-path:groups:${level.id}`, JSON.stringify(next));
      } catch {
        // Storage unavailable fallback
      }
      return next;
    });
  };

  useEffect(() => {
    let cancelled = false;
    setCompletedIds(null);
    setLoadError(false);

    async function loadProgress() {
      const userId = await getOptionalUserId();

      if (!userId) {
        if (!cancelled) setCompletedIds(new Set());
        return;
      }

      const allLevels =
        level.id === "opcionales" && electiveTracks && electiveTracks.length > 0
          ? electiveTracks
          : [level];

      const keysToFetch = allLevels.flatMap((lvl) =>
        lvl.units.flatMap((unit) =>
          unit.lessons.map((lesson) => completionKey(userId, lvl.id, lesson.id))
        )
      );

      const rows = await db.completedLessons.bulkGet(keysToFetch);

      if (cancelled) return;

      setCompletedIds(
        new Set(
          rows
            .filter((row): row is NonNullable<typeof row> => Boolean(row))
            .map((row) => lessonProgressKey(row.courseSlug as CoursePathTrackId, row.lessonSlug))
        )
      );
    }

    loadProgress().catch(() => {
      if (!cancelled) {
        setCompletedIds(new Set());
        setLoadError(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [level, retryKey, electiveTracks]);

  const derived = useMemo(() => {
    if (!completedIds) return null;
    if (level.id === "opcionales" && electiveTracks) {
      let totalCore = 0;
      let completedCore = 0;
      let assignedCurrent = false;

      const derivedUnits: DerivedUnitView[] = electiveTracks.flatMap((track) =>
        track.units.map((unit) => {
          const lessons = unit.lessons.map((lesson) => {
            const key = lessonProgressKey(track.id, lesson.id);
            const isDone = completedIds.has(key);
            totalCore++;
            if (isDone) {
              completedCore++;
              return { ...lesson, state: "done" as const };
            }
            if (!assignedCurrent) {
              assignedCurrent = true;
              return { ...lesson, state: "current" as const };
            }
            return { ...lesson, state: "available" as const };
          });
          const allDone = lessons.every((l) => l.state === "done");
          return {
            unit,
            status: allDone ? ("done" as const) : ("active" as const),
            progressPercent:
              lessons.length > 0
                ? Math.round(
                    (lessons.filter((l) => l.state === "done").length / lessons.length) * 100
                  )
                : 0,
            lessons,
            defaultOpen: false,
          };
        })
      );

      const percent = totalCore > 0 ? Math.round((completedCore / totalCore) * 100) : 0;
      return {
        level,
        progressPercent: percent,
        completedCoreLessons: completedCore,
        totalCoreLessons: totalCore,
        completedUnits: derivedUnits.filter((u) => u.status === "done").length,
        units: derivedUnits,
      };
    }
    return deriveLevelView(level, completedIds);
  }, [completedIds, level, electiveTracks]);

  const currentLesson = derived?.units.flatMap((unit) => unit.lessons).find((lesson) => lesson.state === "current");
  const firstLesson = derived?.units[0]?.lessons[0];

  const downloadedRows = useLiveQuery(
    () =>
      level.id === "opcionales"
        ? db.downloadedLessons.toArray()
        : db.downloadedLessons.where("trackId").equals(level.id).toArray(),
    [level.id],
    [],
  );
  const downloadedIds = useMemo(
    () => new Set((downloadedRows ?? []).map((row) => `${row.trackId}:${row.lessonNumber}`)),
    [downloadedRows],
  );

  if (!derived || !completedIds) {
    return (
      <div
        className="course-path__progress-loading"
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label="Comprobando tu progreso"
      >
        <span className="sr-only">Comprobando tu progreso…</span>
        <WordCarousel words={loadingWords} />
      </div>
    );
  }

  const totalLessonCount = derived.units.reduce((sum, u) => sum + u.unit.lessons.length, 0);
  const completedLessonCount = derived.units.reduce(
    (sum, u) => sum + u.lessons.filter((l) => l.state === "done").length,
    0
  );
  const showAside = !hideAside && !level.isElective;

  return (
    <div
      className={cn(
        "course-path__client-layout",
        !showAside && "course-path__client-layout--no-aside"
      )}
    >
      <div className="course-path__client-main">
        {loadError && (
          <div className="course-path__load-error" role="alert">
            <span>No hemos podido leer tu progreso en este dispositivo. Mostramos la ruta sin progreso guardado.</span>
            <button type="button" className="course-path__load-retry" onClick={() => setRetryKey((key) => key + 1)}>
              Reintentar
            </button>
          </div>
        )}

        {!compactHead && (
          <div className="course-path__head-row flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-2 sm:mb-6">
            <div className="course-path__head min-w-0 flex-1 hidden lg:block">
              <h2 className="text-h2 font-heading font-bold text-fg">{derived.level.title}</h2>
              {derived.level.description && (
                <p className="course-path__head-subtitle text-body-sm text-fg-muted mt-1">
                  {derived.level.description}
                </p>
              )}
            </div>
            <div className="course-path__head-actions flex items-center gap-4 shrink-0 pt-0 sm:pt-1">
              <Link
                href="/assessment"
                className="course-path__text-link font-semibold text-primary hover:underline text-xs sm:text-sm"
                title="Evaluación diagnóstica inicial para ubicar tu nivel"
              >
                Test de ubicación
              </Link>
              <Link
                href={`/assessment?mode=checkpoint&level=${learnerLevelId}`}
                className="course-path__text-link font-semibold text-primary hover:underline text-xs sm:text-sm"
                title="Evaluación de salida de tu nivel"
              >
                {isNavigatingOwnLevel ? "Checkpoint" : `Checkpoint de tu nivel (${learnerLevelId.toUpperCase()})`}
              </Link>
            </div>
          </div>
        )}

        {!hideHero && (() => {
          const hasProgress = completedIds.size > 0;
          const targetLesson = hasProgress && currentLesson ? currentLesson : firstLesson;
          const targetUnit = derived.units.find((u) =>
            u.lessons.some((l) => l.id === targetLesson?.id)
          ) ?? derived.units[0];
          const unitCompletedCount = targetUnit
            ? targetUnit.lessons.filter((l) => l.state === "done").length
            : 0;
          const unitTotalCount = targetUnit ? targetUnit.unit.lessons.length : 6;
          const targetTrack =
            level.id === "opcionales" && electiveTracks
              ? electiveTracks.find((t) =>
                  t.units.some((u) => u.lessons.some((l) => l.id === targetLesson?.id))
                )
              : undefined;

          return (
            <CoursePathHeroBanner
              levelId={level.id}
              trackId={targetTrack?.id}
              levelTitle={level.title}
              levelSpineLabel={level.spineLabel}
              firstLesson={firstLesson}
              currentLesson={currentLesson}
              hasProgress={hasProgress}
              unitCompletedCount={unitCompletedCount}
              unitTotalCount={unitTotalCount}
            />
          );
        })()}

        {!hideSearch && (
          <div className="course-path__main-search mb-3 sm:mb-4">
            <CoursePathSearch />
          </div>
        )}

        <div className="course-path__units" aria-label="Unidades del curso">
          {level.id === "opcionales" ? (
            <CoursePathC1Electives
              tracks={electiveTracks ?? []}
              topicImmersionMap={topicImmersionMap}
              completedIds={completedIds}
              downloadedIds={downloadedIds}
              isStandaloneTab
            />
          ) : level.isElective ? (
            <div className="course-path__spine-body p-1 sm:p-2">
              {derived.units
                .flatMap((u) => u.lessons)
                .map((lesson, index, all) => (
                  <CoursePathLessonRow
                    key={lesson.id}
                    lesson={lesson}
                    levelId={level.id}
                    isDownloaded={downloadedIds.has(`${level.id}:${lesson.number}`)}
                    immersionLesson={lesson.slug ? topicImmersionMap?.[lesson.slug] : undefined}
                    isLast={index === all.length - 1}
                  />
                ))}
            </div>
          ) : (
            derived.units.map((unit) => {
              const isOptional = Boolean(unit.unit.isOptionalSection);
              const optId = `${unit.unit.id}-optional-card`;

              if (isOptional) {
                return (
                  <CoursePathOptionalCard
                    key={unit.unit.id}
                    unit={unit}
                    levelId={level.id}
                    isOpen={expandedGroups[optId] ?? false}
                    onToggle={handleGroupToggle}
                    downloadedIds={downloadedIds}
                    topicImmersionMap={topicImmersionMap}
                  />
                );
              }

              return (
                <CoursePathMainCard
                  key={unit.unit.id}
                  unit={unit}
                  levelId={level.id}
                  firstLessonId={firstLesson?.id}
                  completedIdsCount={completedIds.size}
                  expandedGroups={expandedGroups}
                  onToggle={handleGroupToggle}
                  downloadedIds={downloadedIds}
                  topicImmersionMap={topicImmersionMap}
                />
              );
            })
          )}
        </div>

        {level.realLife && level.realLife.length > 0 && (
          <CoursePathYaPuedesDecirEsto
            scenarios={level.realLife}
            isUnlocked={completedIds.size > 0}
          />
        )}

        <CoursePracticeSuggestions level={level} levelId={level.id} completedIds={completedIds} />

        {level.id !== "opcionales" && electiveTracks && electiveTracks.length > 0 && (
          <CoursePathC1Electives
            tracks={electiveTracks}
            topicImmersionMap={topicImmersionMap}
            completedIds={completedIds}
            downloadedIds={downloadedIds}
          />
        )}
      </div>

      {showAside && (
        <div className="course-path__client-aside mt-8 lg:mt-0">
          <CoursePathAsideProgress
            level={level}
            selectedLevelId={level.id}
            completedCount={completedLessonCount}
            totalCount={totalLessonCount}
            showCheckpoint={level.id !== "opcionales"}
          />
        </div>
      )}
    </div>
  );
}

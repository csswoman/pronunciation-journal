"use client";

// Planned structure:
// <LevelConceptsProgressCard>
//   <CardHeader>
//     <KickerAndCefrPicker selectedLevel={selectedLevel} onSelect={setSelectedLevel} />
//     <TitleText title="Gramática y conceptos" />
//   </CardHeader>
//   <ProgressBarBlock levelTitle={levelData.title} mastered={mastered.length} total={total} pct={masteredPct} />
//   <StatusPillsTabList activeTab={activeTab} onSelectTab={setActiveTab} />
//   <LevelConceptsList items={currentList} activeTab={activeTab} selectedLevel={selectedLevel} />
// </LevelConceptsProgressCard>

import { useState } from "react";
import { COURSE_PATH_CURRICULUM } from "@/lib/courses/curriculum";
import type { CefrLevelId, CoursePathTrackId } from "@/lib/courses/types";
import { cn } from "@/lib/cn";
import type { CompletedLessonRow, TopicProgressRow } from "@/lib/progress/domain-queries";
import { buildTopicStatusByDeck } from "@/lib/progress/topic-progress";
import {
  LevelConceptsList,
  type LevelConceptItem,
  type StatusTab,
} from "./LevelConceptsList";

export type { LevelConceptItem, StatusTab };

interface Props {
  topics: TopicProgressRow[];
  completedRoute?: CompletedLessonRow[];
  initialLevel: CefrLevelId;
}

export function LevelConceptsProgressCard({ topics, completedRoute, initialLevel }: Props) {
  const [selectedLevel, setSelectedLevel] = useState<CoursePathTrackId>(initialLevel);
  const [activeTab, setActiveTab] = useState<StatusTab>("mastered");

  const levelData =
    COURSE_PATH_CURRICULUM.levels.find((l) => l.id === selectedLevel) ??
    COURSE_PATH_CURRICULUM.levels[0];

  const completedSlugSet = new Set(
    completedRoute?.map((r) => r.lessonSlug) ?? [],
  );

  const topicStatusByDeck = buildTopicStatusByDeck(topics);

  const allLessons: LevelConceptItem[] = levelData.units.flatMap((unit) =>
    unit.lessons
      .filter((lesson): lesson is typeof lesson & { slug: string } => Boolean(lesson.slug))
      .map((lesson) => {
        const isRouteCompleted = completedSlugSet.has(lesson.slug);
        const rawStatus = topicStatusByDeck.get(lesson.slug);
        const status = rawStatus ?? "pending";
        return {
          id: lesson.id,
          title: lesson.title,
          slug: lesson.slug,
          group: lesson.group,
          status,
          isRouteCompleted,
        };
      }),
  );

  const mastered = allLessons.filter((l) => l.status === "mastered");
  const inReview = allLessons.filter((l) => l.status === "review");
  const pending = allLessons.filter((l) => l.status === "pending");
  const completedRouteCount = allLessons.filter((l) => l.isRouteCompleted).length;

  const total = allLessons.length;
  const masteredPct = total > 0 ? Math.round((mastered.length / total) * 100) : 0;
  const currentList = activeTab === "mastered" ? mastered : activeTab === "review" ? inReview : pending;

  const tabs = [
    { id: "mastered" as const, label: "Dominados", count: mastered.length, accessibleLabel: "retenidos" },
    { id: "review" as const, label: "En repaso", count: inReview.length, accessibleLabel: "en aprendizaje" },
    { id: "pending" as const, label: "Faltan", count: pending.length, accessibleLabel: "por iniciar" },
  ];

  return (
    <section className="flex flex-col justify-between rounded-3xl border border-border-subtle bg-surface-raised p-6 sm:p-7">
      <div>
        {/* Header with CEFR Level Picker */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-kicker font-bold text-xs sm:text-sm uppercase tracking-wider text-fg-subtle">
            DOMINIO POR TEMAS
          </span>

          {/* CEFR Pills */}
          <div
            className="flex items-center gap-1 rounded-full border border-border-subtle bg-surface-sunken p-1"
            role="group"
            aria-label="Seleccionar nivel CEFR"
          >
            {COURSE_PATH_CURRICULUM.levels.map((lvl) => {
              const isSelected = selectedLevel === lvl.id;
              return (
                <button
                  key={lvl.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedLevel(lvl.id)}
                  className={cn(
                    "min-h-[30px] min-w-[34px] rounded-full px-3 py-0.5 text-xs sm:text-sm font-bold uppercase transition-all focus-ring",
                    isSelected
                      ? "bg-primary text-on-primary shadow-xs"
                      : "text-fg-muted hover:text-fg",
                  )}
                >
                  {lvl.id}
                </button>
              );
            })}
          </div>
        </div>

        <h3 className="font-display text-2xl sm:text-3xl font-bold text-fg leading-tight mt-1.5">
          Gramática y conceptos
        </h3>

        {/* Progress header & bar */}
        <div className="mt-4 sm:mt-5 flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-sm sm:text-base font-semibold">
            <span className="text-fg-muted font-medium">{levelData.title}</span>
            <span className="text-fg font-bold">
              {mastered.length}/{total} retenidos ({masteredPct}%)
            </span>
          </div>

          <div
            role="progressbar"
            aria-valuenow={masteredPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Porcentaje de conceptos retenidos en nivel ${levelData.title}`}
            className="h-2.5 w-full overflow-hidden rounded-full bg-surface-sunken"
          >
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, masteredPct))}%` }}
            />
          </div>

          {/* Auxiliary metric for route completion */}
          <div className="flex items-center gap-2 text-xs sm:text-sm text-fg-muted pt-0.5">
            <span className="inline-block h-2 w-2 rounded-full bg-success" aria-hidden="true" />
            <span>
              <strong className="text-fg font-semibold">{completedRouteCount}</strong> lecciones recorridas
            </span>
          </div>
        </div>

        {/* Status Pills */}
        <div
          className="mt-5 flex flex-wrap items-center gap-2.5"
          role="tablist"
          aria-label="Filtrar por estado de concepto"
        >
          {tabs.map(({ id, label, count, accessibleLabel }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                id={`tab-${id}`}
                aria-controls="panel-concepts"
                aria-selected={isActive}
                aria-label={`${label} (${count}) - ${accessibleLabel}`}
                onClick={() => setActiveTab(id)}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-xs sm:text-sm font-semibold transition-all focus-ring",
                  isActive
                    ? "border-primary/50 bg-primary/10 text-primary shadow-xs"
                    : "border-border-subtle bg-surface-sunken text-fg-muted hover:text-fg",
                )}
              >
                {label} {count}
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div className="mt-5">
        <LevelConceptsList
          items={currentList}
          activeTab={activeTab}
          selectedLevel={selectedLevel}
        />
      </div>
    </section>
  );
}

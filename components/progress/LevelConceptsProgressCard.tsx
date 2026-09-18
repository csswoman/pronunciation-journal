"use client";

// Planned structure:
// <LevelConceptsProgressCard>
//   <CardHeader>
//     <TitleAndLevelPicker />
//     <ProgressMetricsSummary routeCompleted={completedRouteCount} mastered={masteredCount} inReview={inReviewCount} />
//     <ProgressBar value={routePct} />
//   </CardHeader>
//   <TabNavigation tabs={["mastered", "review", "pending"]} />
//   <LevelConceptsList items={currentList} activeTab={activeTab} selectedLevel={selectedLevel} />
// </LevelConceptsProgressCard>

import { useState } from "react";
import { Check, Timer, BookOpen } from "@/components/icons";
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

const TAB_CONFIG = [
  { id: "mastered" as const, label: "Retenidos", icon: Check, activeClass: "border-success text-success" },
  { id: "review" as const, label: "En aprendizaje", icon: Timer, activeClass: "border-warning text-warning" },
  { id: "pending" as const, label: "Por iniciar", icon: BookOpen, activeClass: "border-primary text-primary" },
];

export function LevelConceptsProgressCard({ topics, completedRoute, initialLevel }: Props) {
  const [selectedLevel, setSelectedLevel] = useState<CoursePathTrackId>(initialLevel);
  const [activeTab, setActiveTab] = useState<StatusTab>("mastered");

  const levelData =
    COURSE_PATH_CURRICULUM.levels.find((l) => l.id === selectedLevel) ??
    COURSE_PATH_CURRICULUM.levels[0];

  const completedSlugSet = new Set(
    completedRoute?.map((r) => r.lessonSlug) ?? []
  );

  const topicStatusByDeck = buildTopicStatusByDeck(topics);

  const allLessons: LevelConceptItem[] = levelData.units.flatMap((unit) =>
    unit.lessons
      .filter((lesson): lesson is typeof lesson & { slug: string } => !!lesson.slug)
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
  const routePct = total > 0 ? Math.round((completedRouteCount / total) * 100) : 0;
  const currentList = activeTab === "mastered" ? mastered : activeTab === "review" ? inReview : pending;

  const metricIndicators = [
    { count: completedRouteCount, label: "ruta completada", dotClass: "bg-success" },
    { count: mastered.length, label: "retenidos", dotClass: "bg-primary" },
    { count: inReview.length, label: "en aprendizaje", dotClass: "bg-warning" },
  ];

  return (
    <section className="flex flex-col gap-3.5 rounded-[var(--radius-md)] border border-border-subtle bg-surface-raised p-4 sm:p-5">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="font-kicker font-semibold text-fg-subtle">Dominio por temas</span>
          <h2 className="text-h4 font-semibold text-fg">Gramática y Conceptos</h2>
        </div>

        <div className="flex max-w-full items-center gap-1 overflow-x-auto no-scrollbar rounded-md border border-border-subtle bg-surface-sunken p-0.5" role="group" aria-label="Seleccionar nivel CEFR">
          {COURSE_PATH_CURRICULUM.levels.map((lvl) => (
            <button
              key={lvl.id}
              type="button"
              aria-pressed={selectedLevel === lvl.id}
              aria-label={`Nivel ${lvl.id.toUpperCase()}`}
              onClick={() => setSelectedLevel(lvl.id)}
              className={cn(
                "flex min-h-[36px] min-w-[36px] sm:min-h-[32px] sm:min-w-[32px] items-center justify-center rounded px-2.5 py-1 text-caption font-semibold uppercase transition-colors focus-ring",
                selectedLevel === lvl.id
                  ? "bg-surface-raised text-fg shadow-xs"
                  : "text-fg-muted hover:text-fg",
              )}
            >
              {lvl.id}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-1 text-body-sm text-fg-muted">
          <span>{levelData.title}</span>
          <span className="font-semibold text-fg">
            {completedRouteCount}/{total} completadas ({routePct}%)
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={routePct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Porcentaje de lecciones completadas en nivel ${levelData.title}`}
          className="h-2 w-full overflow-hidden rounded-full bg-surface-sunken"
        >
          <span
            className="block h-full w-full rounded-full bg-success origin-left transition-transform duration-300 ease-out"
            style={{ transform: `scaleX(${Math.min(1, Math.max(0, routePct / 100))})` }}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 text-caption text-fg-muted pt-0.5">
          {metricIndicators.map(({ count, label, dotClass }) => (
            <span key={label} className="flex items-center gap-1.5">
              <span className={cn("inline-block h-2 w-2 rounded-full", dotClass)} aria-hidden="true" />
              <span className="text-fg-secondary"><strong className="text-fg">{count}</strong> {label}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto no-scrollbar border-b border-border-subtle pt-1" role="tablist" aria-label="Filtrar por estado de concepto">
        {TAB_CONFIG.map(({ id, label, icon: Icon, activeClass }) => {
          const count = id === "mastered" ? mastered.length : id === "review" ? inReview.length : pending.length;
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              id={`tab-${id}`}
              aria-controls="panel-concepts"
              aria-selected={isActive}
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex min-h-[40px] shrink-0 items-center gap-1.5 border-b-2 px-3 py-1.5 text-body-sm font-medium whitespace-nowrap transition-colors focus-ring",
                isActive
                  ? `${activeClass} font-semibold`
                  : "border-transparent text-fg-muted hover:text-fg",
              )}
            >
              <Icon size={15} aria-hidden />
              <span>{label} ({count})</span>
            </button>
          );
        })}
      </div>

      <LevelConceptsList
        items={currentList}
        activeTab={activeTab}
        selectedLevel={selectedLevel}
      />
    </section>
  );
}

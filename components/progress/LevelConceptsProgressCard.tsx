"use client";

// Planned structure:
// <LevelConceptsProgressCard>
//   <CardHeader>
//     <TitleAndLevelPicker />
//     <ProgressBar />
//   </CardHeader>
//   <TabNavigation />
//   <ConceptList bucket="mastered" | "review" | "pending" />
// </LevelConceptsProgressCard>

import { useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { Check, Timer, BookOpen, ChevronRight } from "@/components/icons";
import { useAuth } from "@/components/auth/AuthProvider";
import { db } from "@/lib/db";
import { COURSE_PATH_CURRICULUM } from "@/lib/courses/curriculum";
import type { CoursePathTrackId } from "@/lib/courses/types";
import { cn } from "@/lib/cn";

type StatusTab = "mastered" | "review" | "pending";

interface LessonItem {
  id: string;
  title: string;
  slug: string;
  group?: string;
  status: "mastered" | "review" | "pending";
}

export function LevelConceptsProgressCard() {
  let user: { id: string } | null = null;
  try {
    user = useAuth()?.user ?? null;
  } catch {
    user = null;
  }
  const [selectedLevel, setSelectedLevel] = useState<CoursePathTrackId>("a1");
  const [activeTab, setActiveTab] = useState<StatusTab>("mastered");

  const learningState = useLiveQuery(
    async () => {
      if (!user) return null;
      const rec = await db.learningState.get(user.id);
      return rec?.state ?? null;
    },
    [user?.id],
    null,
  );

  const levelData =
    COURSE_PATH_CURRICULUM.levels.find((l) => l.id === selectedLevel) ??
    COURSE_PATH_CURRICULUM.levels[0];

  const concepts = learningState?.theory?.concepts ?? [];
  const conceptMap = new Map(concepts.map((c) => [c.lessonSlug, c]));

  const allLessons: LessonItem[] = levelData.units.flatMap((unit) =>
    unit.lessons
      .filter((lesson): lesson is typeof lesson & { slug: string } => !!lesson.slug)
      .map((lesson) => {
        const signal = conceptMap.get(lesson.slug);
        let status: "mastered" | "review" | "pending" = "pending";
        if (signal?.status === "mastered") status = "mastered";
        else if (signal?.status === "review") status = "review";
        return {
          id: lesson.id,
          title: lesson.title,
          slug: lesson.slug,
          group: lesson.group,
          status,
        };
      }),
  );

  const mastered = allLessons.filter((l) => l.status === "mastered");
  const inReview = allLessons.filter((l) => l.status === "review");
  const pending = allLessons.filter((l) => l.status === "pending");

  const total = allLessons.length;
  const pct = total > 0 ? Math.round((mastered.length / total) * 100) : 0;

  const currentList =
    activeTab === "mastered"
      ? mastered
      : activeTab === "review"
        ? inReview
        : pending;

  return (
    <section className="flex flex-col gap-4 rounded-[var(--radius-md)] border border-border-subtle bg-surface-raised p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="font-kicker font-semibold text-fg-subtle">Dominio por temas</span>
          <h2 className="text-h4 font-semibold text-fg">Gramática y Conceptos</h2>
        </div>

        <div className="flex max-w-full items-center gap-1 overflow-x-auto no-scrollbar rounded-lg border border-border-subtle bg-surface-sunken p-1" role="group" aria-label="Seleccionar nivel CEFR">
          {COURSE_PATH_CURRICULUM.levels.map((lvl) => (
            <button
              key={lvl.id}
              type="button"
              aria-pressed={selectedLevel === lvl.id}
              aria-label={`Nivel ${lvl.id.toUpperCase()}`}
              onClick={() => setSelectedLevel(lvl.id)}
              className={cn(
                "flex min-h-[44px] min-w-[44px] items-center justify-center rounded px-3 py-1.5 font-caption font-semibold uppercase transition-colors focus-ring",
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

      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-body-sm text-fg-muted">
          <span>{levelData.title}</span>
          <span className="font-semibold text-fg">
            {mastered.length}/{total} dominados ({pct}%)
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Porcentaje de conceptos dominados en nivel ${levelData.title}`}
          className="h-2 w-full overflow-hidden rounded-full bg-surface-sunken"
        >
          <div
            className="h-full bg-success transition-all duration-300 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar border-b border-border-subtle pt-2" role="tablist" aria-label="Filtrar por estado de concepto">
        <button
          type="button"
          role="tab"
          id="tab-mastered"
          aria-controls="panel-concepts"
          aria-selected={activeTab === "mastered"}
          onClick={() => setActiveTab("mastered")}
          className={cn(
            "flex min-h-[44px] shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-body-sm font-medium whitespace-nowrap transition-colors focus-ring",
            activeTab === "mastered"
              ? "border-success text-success font-semibold"
              : "border-transparent text-fg-muted hover:text-fg",
          )}
        >
          <Check size={15} aria-hidden />
          <span>Dominados ({mastered.length})</span>
        </button>

        <button
          type="button"
          role="tab"
          id="tab-review"
          aria-controls="panel-concepts"
          aria-selected={activeTab === "review"}
          onClick={() => setActiveTab("review")}
          className={cn(
            "flex min-h-[44px] shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-body-sm font-medium whitespace-nowrap transition-colors focus-ring",
            activeTab === "review"
              ? "border-warning text-warning font-semibold"
              : "border-transparent text-fg-muted hover:text-fg",
          )}
        >
          <Timer size={15} aria-hidden />
          <span>En repaso ({inReview.length})</span>
        </button>

        <button
          type="button"
          role="tab"
          id="tab-pending"
          aria-controls="panel-concepts"
          aria-selected={activeTab === "pending"}
          onClick={() => setActiveTab("pending")}
          className={cn(
            "flex min-h-[44px] shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-body-sm font-medium whitespace-nowrap transition-colors focus-ring",
            activeTab === "pending"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-fg-muted hover:text-fg",
          )}
        >
          <BookOpen size={15} aria-hidden />
          <span>Faltan ({pending.length})</span>
        </button>
      </div>

      <div
        id="panel-concepts"
        role="tabpanel"
        tabIndex={0}
        aria-labelledby={`tab-${activeTab}`}
        className="flex flex-col divide-y divide-border-subtle focus-visible:outline-none"
      >
        {currentList.length === 0 ? (
          <p className="py-6 text-center text-body-sm text-fg-muted">
            {activeTab === "mastered"
              ? "Aún no registras temas dominados en este nivel. Completa lecciones y evaluaciones para afianzar conceptos."
              : activeTab === "review"
                ? "No tienes temas pendientes de repaso en este nivel."
                : "Has visto todos los temas disponibles en este nivel."}
          </p>
        ) : (
          currentList.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 py-3 first:pt-1 last:pb-1"
            >
              <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                <span className="text-body-md font-medium text-fg break-words">{item.title}</span>
                {item.group && (
                  <span className="text-body-sm text-fg-muted line-clamp-1">
                    {item.group}
                  </span>
                )}
              </div>
              <Link
                href={`/courses/study/${item.slug}`}
                className="focus-ring flex min-h-[44px] shrink-0 items-center gap-1 rounded-[var(--radius-md)] border border-border-subtle bg-surface-sunken px-3 py-2 text-body-sm font-medium text-fg hover:bg-surface-raised transition-colors"
              >
                <span>{item.status === "mastered" ? "Repasar" : "Estudiar"}</span>
                <ChevronRight size={14} aria-hidden="true" />
              </Link>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { getIllustration } from "@/lib/illustrations/registry";
import { illustrationForCategory } from "@/lib/lexicon/category-illustrations";
import type { LessonViewModel } from "@/lib/lexicon/types";

interface AnkiDeckGridProps {
  lessons: LessonViewModel[];
  onSelectDeck: (categoryId: string) => void;
}

type FilterMode = "all" | "in_progress" | "receptive" | "productive";

export function AnkiDeckGrid({ lessons, onSelectDeck }: AnkiDeckGridProps) {
  const [filter, setFilter] = useState<FilterMode>("all");

  const filteredLessons = useMemo(() => {
    if (filter === "in_progress") return lessons.filter((l) => l.wordsReviewing > 0 || l.wordsCompleted > 0);
    if (filter === "receptive") return lessons.filter((l) => l.studyMode === "receptive");
    if (filter === "productive") return lessons.filter((l) => l.studyMode === "productive");
    return lessons;
  }, [lessons, filter]);

  if (lessons.length === 0) {
    return (
      <div className="text-center py-12 text-fg-muted text-body-sm">
        No hay mazos Anki disponibles en este momento.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-caption font-medium text-fg-subtle mr-1">Filtrar:</span>
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors focus-ring ${
            filter === "all"
              ? "bg-primary text-on-primary"
              : "bg-surface-raised text-fg-muted border border-border-subtle hover:text-fg"
          }`}
        >
          Todos ({lessons.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("in_progress")}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors focus-ring ${
            filter === "in_progress"
              ? "bg-primary text-on-primary"
              : "bg-surface-raised text-fg-muted border border-border-subtle hover:text-fg"
          }`}
        >
          En curso
        </button>
        <button
          type="button"
          onClick={() => setFilter("receptive")}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors focus-ring ${
            filter === "receptive"
              ? "bg-primary text-on-primary"
              : "bg-surface-raised text-fg-muted border border-border-subtle hover:text-fg"
          }`}
        >
          Reconocer
        </button>
        <button
          type="button"
          onClick={() => setFilter("productive")}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors focus-ring ${
            filter === "productive"
              ? "bg-primary text-on-primary"
              : "bg-surface-raised text-fg-muted border border-border-subtle hover:text-fg"
          }`}
        >
          Producir
        </button>
      </div>

      {filteredLessons.length === 0 ? (
        <div className="text-center py-10 rounded-2xl bg-surface-raised/40 border border-border-subtle text-fg-muted text-body-sm">
          No se encontraron mazos con este filtro.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredLessons.map((lesson) => {
        const illustrationKey = illustrationForCategory(lesson.id);
        const Illustration = illustrationKey ? getIllustration(illustrationKey) : null;
        const progressPct = lesson.totalWords > 0 ? Math.round((lesson.wordsCompleted / lesson.totalWords) * 100) : 0;
        const inProgress = lesson.wordsReviewing > 0;

        return (
          <div
            key={lesson.id}
            className="group relative flex flex-col justify-between rounded-2xl border border-border-subtle bg-surface-raised p-6 shadow-xs hover:border-primary/60 hover:shadow-md transition-all duration-200"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-soft/80 text-primary p-2.5 transition-transform group-hover:scale-105">
                  {Illustration ? (
                    <Illustration className="h-full w-full object-contain" />
                  ) : (
                    <span className="font-bold text-h4">{lesson.title.charAt(0)}</span>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  <span className="rounded-full bg-primary-soft text-primary px-2.5 py-0.5 text-xs font-semibold border border-primary/20">
                    {lesson.studyMode === "receptive" ? "Reconocer" : "Producir"}
                  </span>
                  {inProgress && (
                    <span className="rounded-full bg-surface-sunken text-fg-subtle px-2.5 py-0.5 text-xs font-mono">
                      {lesson.wordsReviewing} en curso
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-h4 font-bold text-fg group-hover:text-primary transition-colors tracking-tight">
                  {lesson.title}
                </h3>
                <p className="text-body-sm text-fg-muted">
                  Mazo de {lesson.totalWords} tarjetas de vocabulario
                </p>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-caption text-fg-subtle font-medium">
                  <span>Progreso del mazo</span>
                  <span className="font-mono text-tiny">{progressPct}% ({lesson.wordsCompleted}/{lesson.totalWords})</span>
                </div>
                <div className="h-2 w-full rounded-full bg-surface-sunken overflow-hidden" aria-hidden>
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 mt-6 border-t border-border-subtle/50 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => onSelectDeck(lesson.id)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-on-primary px-4 py-2.5 text-body-sm font-semibold hover:bg-primary-hover active:scale-[0.98] transition-all focus-ring shadow-xs"
              >
                <span>Estudiar mazo</span>
                <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
              </button>

              <Link
                href={`/words/${lesson.id}`}
                className="text-caption font-medium text-fg-subtle hover:text-fg underline underline-offset-2 transition-colors py-1"
              >
                Ver palabras
              </Link>
            </div>
          </div>
        );
        })}
        </div>
      )}
    </div>
  );
}

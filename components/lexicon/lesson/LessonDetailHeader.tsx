"use client";

import Link from "next/link";
import { Dumbbell } from "@/components/icons";

interface LessonDetailHeaderProps {
  categoryTitle?: string;
  title?: string;
  blurb?: string;
  categoryId?: string;
  learnedPct?: number;
  statusCounts?: {
    learned: number;
    reviewing: number;
    new: number;
  };
  totalWords?: number;
}

/**
 * LessonDetailHeader - Cabecera de lección de vocabulario con progreso y CTA.
 *
 * Sub-componentes:
 * - BreadcrumbNav (Ruta de navegación al Diccionario)
 * - HeaderContent (Título, descripción y botón de práctica)
 * - ProgressMetrics (Barra de progreso semántica y chips de estado)
 */
export function LessonDetailHeader({
  categoryTitle,
  title,
  blurb,
  categoryId,
  learnedPct,
  statusCounts,
  totalWords,
}: LessonDetailHeaderProps) {
  const displayTitle = categoryTitle ?? title ?? "";
  return (
    <header className="bg-surface-raised border border-border-subtle rounded-xl p-6 md:p-8 flex flex-col gap-6 shadow-xs">
      {/* Fila superior: Título, Descripción y Botón de Práctica */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex flex-col gap-2">
          <nav
            className="flex items-center gap-1.5 font-mono text-tiny text-fg-subtle mb-0.5"
            aria-label="Ruta de navegación"
          >
            <Link href="/words" className="hover:text-fg hover:underline transition-colors">
              Diccionario
            </Link>
            <span aria-hidden>/</span>
            <span aria-current="page" className="text-fg-muted font-medium">
              {displayTitle}
            </span>
          </nav>

          <h1 className="text-h2 md:text-h1 font-bold tracking-tight text-fg">
            {displayTitle}
          </h1>
          {blurb ? (
            <p className="text-body-md text-fg-muted leading-relaxed max-w-2xl">
              {blurb}
            </p>
          ) : null}
        </div>

        {categoryId ? (
          <div className="shrink-0 self-stretch md:self-auto">
            <Link
              href={`/words/${categoryId}/practice`}
              className="inline-flex items-center justify-center rounded-full cursor-pointer font-medium transition-colors duration-150 ease-out-quart focus-ring bg-primary text-on-primary hover:bg-primary-hover text-caption py-2.5 px-6 gap-2 w-full md:w-auto shadow-xs"
            >
              <Dumbbell size={16} aria-hidden />
              Practicar este tema
            </Link>
          </div>
        ) : null}
      </div>

      {/* Fila inferior: Barra de progreso a lo ancho y métricas de palabras */}
      {statusCounts && learnedPct !== undefined ? (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-5 border-t border-border-subtle">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 max-w-xl">
            <div className="flex items-baseline gap-2 shrink-0">
              <span className="font-mono text-tiny uppercase tracking-wider text-fg-subtle font-medium">
                Progreso
              </span>
              <strong className="text-h4 font-bold text-fg tabular-nums">{learnedPct}%</strong>
            </div>

            <div
              className="w-full h-2 rounded-full bg-surface-sunken border border-border-subtle overflow-hidden flex-1"
              role="progressbar"
              aria-label="Palabras aprendidas"
              aria-valuenow={statusCounts.learned}
              aria-valuemin={0}
              aria-valuemax={totalWords ?? statusCounts.learned}
            >
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${learnedPct}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-caption bg-surface-sunken border border-border-subtle font-medium text-fg-muted">
              {statusCounts.learned} aprendidas
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-caption bg-surface-sunken border border-border-subtle font-medium text-fg-muted">
              {statusCounts.reviewing} en repaso
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-caption bg-surface-sunken border border-border-subtle font-medium text-fg-muted">
              {statusCounts.new} nuevas
            </span>
          </div>
        </div>
      ) : null}
    </header>
  );
}


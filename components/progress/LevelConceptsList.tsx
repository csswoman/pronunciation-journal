"use client";

// Planned structure:
// <LevelConceptsList>
//   <ConceptEmptyState illustration={EmptySearch} message={emptyMessage} subtitle={emptySubtitle} />
//   <ConceptListContainer>
//     <ConceptListItem>
//       <ConceptItemInfo title={item.title} group={item.group} isRouteCompleted={item.isRouteCompleted} />
//       <ConceptStudyAction slug={item.slug} actionLabel={actionLabel} />
//     </ConceptListItem>
//   </ConceptListContainer>
//   <ConceptPaginationControls page={page} totalPages={totalPages} />
// </LevelConceptsList>

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "@/components/icons";
import { getIllustration } from "@/lib/illustrations/registry";
import { resolveLessonHref } from "@/lib/courses/curriculumIndex";

export type StatusTab = "mastered" | "review" | "pending";

export interface LevelConceptItem {
  id: string;
  title: string;
  slug: string;
  group?: string;
  status: StatusTab;
  isRouteCompleted: boolean;
}

interface LevelConceptsListProps {
  items: LevelConceptItem[];
  activeTab: StatusTab;
  selectedLevel: string;
  pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 4;

function getEmptyStateInfo(activeTab: StatusTab) {
  if (activeTab === "mastered") {
    return {
      title: "Sin temas retenidos aún en este nivel",
      subtitle: "Inicia y completa lecciones para demostrar tu dominio y retención de estos conceptos.",
    };
  }
  if (activeTab === "review") {
    return {
      title: "Sin temas pendientes de repaso",
      subtitle: "¡Todo al día! No tienes conceptos de este nivel que requieran repaso inmediato.",
    };
  }
  return {
    title: "Todos los temas han sido iniciados o dominados",
    subtitle: "Has comenzado todas las lecciones de este nivel. Puedes seguir practicando para consolidarlas.",
  };
}

export function LevelConceptsList({
  items,
  activeTab,
  selectedLevel,
  pageSize = DEFAULT_PAGE_SIZE,
}: LevelConceptsListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const EmptyIllustration = getIllustration("emptySearch");
  const emptyInfo = getEmptyStateInfo(activeTab);

  const effectivePageSize = Math.max(1, pageSize);
  const totalPages = Math.ceil(items.length / effectivePageSize);
  const displayedItems = items.slice(
    (currentPage - 1) * effectivePageSize,
    currentPage * effectivePageSize,
  );

  return (
    <div
      id="panel-concepts"
      key={`${selectedLevel}-${activeTab}`}
      role="tabpanel"
      tabIndex={0}
      aria-labelledby={`tab-${activeTab}`}
      className="flex flex-col divide-y divide-border-subtle/60 focus-visible:outline-none animate-state-in"
    >
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <div className="mb-4 flex items-center justify-center text-fg-muted/40 transition-transform duration-300 hover:scale-105">
            <EmptyIllustration className="h-28 w-auto text-fg-muted/50" />
          </div>
          <h4 className="font-display text-base sm:text-lg font-bold text-fg">
            {emptyInfo.title}
          </h4>
          <p className="mt-1.5 max-w-sm text-sm font-normal text-fg-muted leading-relaxed">
            {emptyInfo.subtitle}
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col divide-y divide-border-subtle/60" key={currentPage}>
            {displayedItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4 py-4 first:pt-2 last:pb-2"
              >
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base sm:text-lg font-bold text-fg break-words leading-snug">
                      {item.title}
                    </span>
                    {item.isRouteCompleted ? (
                      <span className="inline-flex items-center rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success border border-success/25">
                        Ruta completada
                      </span>
                    ) : null}
                    {item.status === "review" ? (
                      <span className="inline-flex items-center rounded-full bg-warning/15 px-2.5 py-0.5 text-xs font-semibold text-warning border border-warning/25">
                        En repaso
                      </span>
                    ) : null}
                  </div>
                  {item.group && (
                    <span className="text-sm text-fg-muted font-normal line-clamp-1">
                      {item.group}
                    </span>
                  )}
                </div>

                <Link
                  href={resolveLessonHref(item.slug)}
                  className="flex min-h-[36px] shrink-0 items-center justify-center rounded-full border border-border-subtle bg-surface-sunken px-5 py-1.5 text-xs sm:text-sm font-bold text-fg hover:bg-surface-raised active:scale-[0.96] transition-all focus-ring"
                >
                  {item.isRouteCompleted || item.status === "mastered"
                    ? "Repasar"
                    : "Iniciar"}
                </Link>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between pt-3 border-t border-border-subtle/50">
              <span className="text-xs sm:text-sm text-fg-muted font-medium">
                Página {currentPage} de {totalPages}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-full border border-border-subtle bg-surface-sunken text-fg hover:bg-surface-raised disabled:opacity-30 disabled:cursor-not-allowed transition-all focus-ring"
                  aria-label="Página anterior de temas"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-full border border-border-subtle bg-surface-sunken text-fg hover:bg-surface-raised disabled:opacity-30 disabled:cursor-not-allowed transition-all focus-ring"
                  aria-label="Página siguiente de temas"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

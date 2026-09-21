"use client";

// Planned structure:
// <LevelConceptsList>
//   <ConceptEmptyState />
//   <ConceptListContainer>
//     <ConceptListItem>
//       <ConceptItemInfo>
//         <ConceptItemBadges />
//       </ConceptItemInfo>
//       <ConceptStudyAction />
//     </ConceptListItem>
//   </ConceptListContainer>
// </LevelConceptsList>

import Link from "next/link";
import { ChevronRight } from "@/components/icons";

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
}

export function LevelConceptsList({
  items,
  activeTab,
  selectedLevel,
}: LevelConceptsListProps) {
  return (
    <div
      id="panel-concepts"
      key={`${selectedLevel}-${activeTab}`}
      role="tabpanel"
      tabIndex={0}
      aria-labelledby={`tab-${activeTab}`}
      className="flex flex-col divide-y divide-border-subtle focus-visible:outline-none animate-state-in"
    >
      {items.length === 0 ? (
        <p className="py-3 text-center text-caption text-fg-muted">
          {activeTab === "mastered"
            ? "Sin temas retenidos aún en este nivel."
            : activeTab === "review"
              ? "Sin temas pendientes de repaso."
              : "Todos los temas de este nivel han sido iniciados o completados."}
        </p>
      ) : (
        items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 py-3 first:pt-1 last:pb-1"
          >
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-body-md font-medium text-fg break-words">
                  {item.title}
                </span>
                {item.isRouteCompleted ? (
                  <span className="inline-flex items-center rounded-full bg-success-soft px-2 py-0.5 text-tiny font-medium text-success">
                    Ruta completada
                  </span>
                ) : null}
                {item.status === "review" ? (
                  <span className="inline-flex items-center rounded-full bg-warning-soft px-2 py-0.5 text-tiny font-medium text-warning">
                    En repaso
                  </span>
                ) : null}
              </div>
              {item.group && (
                <span className="text-body-sm text-fg-muted line-clamp-1">
                  {item.group}
                </span>
              )}
            </div>
            <Link
              href={`/courses/study/${item.slug}`}
              className="focus-ring flex min-h-[40px] shrink-0 items-center gap-1 rounded-[var(--radius-md)] border border-border-subtle bg-surface-sunken px-3 py-1.5 text-body-sm font-medium text-fg hover:bg-surface-raised transition-colors active:scale-[0.96] transition-transform"
            >
              <span>
                {item.isRouteCompleted || item.status === "mastered"
                  ? "Repasar"
                  : "Iniciar"}
              </span>
              <ChevronRight size={14} aria-hidden="true" />
            </Link>
          </div>
        ))
      )}
    </div>
  );
}

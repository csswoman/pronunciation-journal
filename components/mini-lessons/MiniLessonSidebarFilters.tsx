// Planned structure:
// <MiniLessonSidebarFilters>
//   <FilterCardSection>
//     <SearchInput />
//   </FilterCardSection>
//   <FilterCardSection>
//     <CollapsibleLevelHeader />
//     <LevelRowsGroup>
//       <LevelRowWithIconAndPill /> × N
//     </LevelRowsGroup>
//   </FilterCardSection>
//   <FilterCardSection>
//     <CollapsibleCategoryHeader />
//     <CategoryMiniCardGrid>
//       <CategoryMiniCard /> × N
//     </CategoryMiniCardGrid>
//   </FilterCardSection>
// </MiniLessonSidebarFilters>

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { ChevronDown, ChevronUp, Search, X } from "@/components/icons";
import { CategoryIcon } from "@/components/mini-lessons/CategoryIcon";
import { LevelIcon } from "@/components/mini-lessons/LevelIcon";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  LESSON_LEVELS,
  LESSON_CATEGORIES,
  type LessonLevel,
  type LessonCategory,
} from "@/lib/content/schemas";
import {
  MINI_LESSON_CATEGORY_LABELS,
  MINI_LESSON_LEVEL_LABELS,
} from "@/lib/content/mini-lesson-labels";

const levels: LessonLevel[] = [...LESSON_LEVELS];
const categories: LessonCategory[] = [...LESSON_CATEGORIES];

interface MiniLessonSidebarFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedLevel: LessonLevel | "all";
  onLevelChange: (level: LessonLevel | "all") => void;
  selectedCategory: LessonCategory | "all";
  onCategoryChange: (category: LessonCategory | "all") => void;
  levelCounts: Record<string, number>;
  categoryCounts: Record<string, number>;
}

export function MiniLessonSidebarFilters({
  searchQuery,
  onSearchChange,
  selectedLevel,
  onLevelChange,
  selectedCategory,
  onCategoryChange,
  levelCounts,
  categoryCounts,
}: MiniLessonSidebarFiltersProps) {
  const isMobileOrTablet = useMediaQuery("(max-width: 1024px)");
  const [isLevelExpanded, setIsLevelExpanded] = useState(false);
  const [isCategoryExpanded, setIsCategoryExpanded] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (!hasInitialized) {
      setHasInitialized(true);
      if (!isMobileOrTablet) {
        setIsLevelExpanded(true);
        setIsCategoryExpanded(true);
      }
    }
  }, [isMobileOrTablet, hasInitialized]);

  return (
    <aside className="mini-lessons__filters flex flex-col gap-4" aria-label="Filtrar lecciones">
      {/* Search Input Box */}
      <div className="relative flex items-center w-full">
        <Search className="absolute left-3 w-4 h-4 text-fg-subtle pointer-events-none" />
        <input
          type="search"
          value={searchQuery}
          aria-label="Buscar lecciones"
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar lección..."
          className="w-full pl-9 pr-8 py-2 min-h-[44px] text-body-sm rounded-md bg-surface-raised border border-border-subtle text-fg placeholder:text-fg-placeholder focus:border-primary focus:outline-none transition-colors shadow-xs"
        />
        {searchQuery.trim().length > 0 && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-2.5 p-1 text-fg-subtle hover:text-fg rounded-full transition-colors"
            aria-label="Limpiar búsqueda"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Level Filter Card: Collapsible with quiet icons, active pill, and count */}
      <div
        className="mini-lessons__filter-card bg-surface-raised border border-border-subtle rounded-md p-4 space-y-3 shadow-xs"
        role="group"
        aria-labelledby="lesson-level-filter"
      >
        <button
          type="button"
          onClick={() => setIsLevelExpanded(!isLevelExpanded)}
          className="flex items-center justify-between w-full text-left font-mono text-kicker text-fg-muted font-semibold hover:text-fg transition-colors"
        >
          <div className="flex items-center gap-2">
            <span id="lesson-level-filter">Nivel</span>
            {!isLevelExpanded && selectedLevel !== "all" && (
              <span className="font-sans text-caption text-primary font-normal">
                • {MINI_LESSON_LEVEL_LABELS[selectedLevel]}
              </span>
            )}
          </div>
          {isLevelExpanded ? (
            <ChevronUp className="w-4 h-4 text-fg-subtle" />
          ) : (
            <ChevronDown className="w-4 h-4 text-fg-subtle" />
          )}
        </button>

        {isLevelExpanded && (
          <div className="flex flex-col gap-1 w-full pt-1">
            <button
              type="button"
              className={cn(
                "mini-lessons__level-row transition-all duration-150",
                selectedLevel === "all" && "mini-lessons__level-row--active"
              )}
              aria-pressed={selectedLevel === "all"}
              onClick={() => onLevelChange("all")}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "p-1.5 rounded-full border flex items-center justify-center transition-colors",
                    selectedLevel === "all"
                      ? "bg-primary/10 border-primary/20 text-primary"
                      : "bg-surface-sunken border-border-subtle text-fg-muted"
                  )}
                >
                  <LevelIcon level="all" size="sm" />
                </span>
                <span className="font-medium text-body-sm">Todos</span>
              </div>
              <span className="mini-lessons__chip-count">
                {levelCounts.all ?? 0}
              </span>
            </button>

            {levels.map((level) => {
              const isSelected = selectedLevel === level;
              return (
                <button
                  key={level}
                  type="button"
                  className={cn(
                    "mini-lessons__level-row transition-all duration-150",
                    isSelected && "mini-lessons__level-row--active"
                  )}
                  aria-pressed={isSelected}
                  onClick={() => onLevelChange(level)}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        "p-1.5 rounded-full border flex items-center justify-center transition-colors",
                        isSelected
                          ? "bg-primary/10 border-primary/20 text-primary"
                          : "bg-surface-sunken border-border-subtle text-fg-muted"
                      )}
                    >
                      <LevelIcon level={level} size="sm" />
                    </span>
                    <span className="font-medium text-body-sm">
                      {MINI_LESSON_LEVEL_LABELS[level]}
                    </span>
                  </div>
                  {levelCounts[level] !== undefined && (
                    <span className="mini-lessons__chip-count">{levelCounts[level]}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Category Filter Card: Collapsible 2x2 Grid of Quiet Mini-Cards */}
      <div
        className="mini-lessons__filter-card bg-surface-raised border border-border-subtle rounded-md p-4 space-y-3 shadow-xs"
        role="group"
        aria-labelledby="lesson-category-filter"
      >
        <button
          type="button"
          onClick={() => setIsCategoryExpanded(!isCategoryExpanded)}
          className="flex items-center justify-between w-full text-left font-mono text-kicker text-fg-muted font-semibold hover:text-fg transition-colors"
        >
          <div className="flex items-center gap-2">
            <span id="lesson-category-filter">Tema</span>
            {!isCategoryExpanded && selectedCategory !== "all" && (
              <span className="font-sans text-caption text-primary font-normal">
                • {MINI_LESSON_CATEGORY_LABELS[selectedCategory]}
              </span>
            )}
          </div>
          {isCategoryExpanded ? (
            <ChevronUp className="w-4 h-4 text-fg-subtle" />
          ) : (
            <ChevronDown className="w-4 h-4 text-fg-subtle" />
          )}
        </button>

        {isCategoryExpanded && (
          <div className="grid grid-cols-2 gap-2 w-full pt-1">
            <button
              type="button"
              className={cn(
                "mini-lessons__category-card transition-all duration-150",
                selectedCategory === "all" && "mini-lessons__category-card--active"
              )}
              aria-pressed={selectedCategory === "all"}
              onClick={() => onCategoryChange("all")}
            >
              <div
                className={cn(
                  "mini-lessons__category-icon-wrapper transition-colors",
                  selectedCategory === "all"
                    ? "bg-primary/10 text-primary"
                    : "bg-surface-sunken text-fg-muted"
                )}
              >
                <CategoryIcon category="all" size="sm" />
              </div>
              <span className="mini-lessons__category-title">Todas</span>
            </button>

            {categories.map((category) => {
              const isSelected = selectedCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  className={cn(
                    "mini-lessons__category-card transition-all duration-150",
                    isSelected && "mini-lessons__category-card--active"
                  )}
                  aria-pressed={isSelected}
                  onClick={() => onCategoryChange(category)}
                >
                  <div
                    className={cn(
                      "mini-lessons__category-icon-wrapper transition-colors",
                      isSelected
                        ? "bg-primary/10 text-primary"
                        : "bg-surface-sunken text-fg-muted"
                    )}
                  >
                    <CategoryIcon category={category} size="sm" />
                  </div>
                  <span className="mini-lessons__category-title">
                    {MINI_LESSON_CATEGORY_LABELS[category]}
                  </span>
                  {categoryCounts[category] !== undefined && (
                    <span className="text-caption text-fg-subtle">
                      {categoryCounts[category]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}

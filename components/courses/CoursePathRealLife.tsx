// Planned structure:
// <CoursePathRealLife>
//   <header (title + subtitle + collapse toggle)>
//   <collapsible body>
//     <viewport (single active card)>
//     <nav (prev / dots + counter / next)>
//   </collapsible body>
// </CoursePathRealLife>

"use client";

import { useCallback, useState } from "react";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import type { RealLifeScenario } from "@/lib/courses/types";
import CoursePathRealLifeCard from "@/components/courses/CoursePathRealLifeCard";

interface CoursePathRealLifeProps {
  scenarios: RealLifeScenario[];
}

export default function CoursePathRealLife({ scenarios }: CoursePathRealLifeProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const hasMultiple = scenarios.length > 1;
  const active = scenarios[activeIndex];

  const goTo = useCallback(
    (index: number) => {
      setActiveIndex(Math.max(0, Math.min(scenarios.length - 1, index)));
    },
    [scenarios.length],
  );

  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);
  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);

  return (
    <section className="course-path__irl" aria-label="Situaciones de cada día">
      <div className="course-path__irl-head">
        <button
          type="button"
          className="course-path__irl-toggle"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
        >
          <h3 className="course-path__irl-title">🌍 Situaciones de cada día</h3>
          <ChevronDown
            size={16}
            aria-hidden
            className={cn("course-path__irl-chevron", collapsed && "course-path__irl-chevron--collapsed")}
          />
        </button>
        {!collapsed && (
          <p className="course-path__irl-sub">
            Frases y vocabulario para situaciones reales de este nivel
          </p>
        )}
      </div>

      {!collapsed && (
        <>
          <div className="course-path__irl-stage" aria-live="polite">
            <div className="course-path__irl-viewport">
              <CoursePathRealLifeCard key={active.id} scenario={active} />
            </div>
          </div>

          {hasMultiple && (
            <nav className="course-path__irl-nav" aria-label="Navegación de situaciones">
          <button
            type="button"
            className="course-path__irl-arrow"
            onClick={goPrev}
            disabled={activeIndex === 0}
            aria-label="Situación anterior"
          >
            <ChevronLeft size={18} aria-hidden />
          </button>

          <div className="course-path__irl-pager">
            <div className="course-path__irl-dots" role="tablist" aria-label="Situaciones">
              {scenarios.map((scenario, index) => (
                <button
                  key={scenario.id}
                  type="button"
                  role="tab"
                  className={cn(
                    "course-path__irl-dot",
                    index === activeIndex && "course-path__irl-dot--active",
                  )}
                  aria-selected={index === activeIndex}
                  aria-label={`${scenario.title} (${index + 1} de ${scenarios.length})`}
                  onClick={() => goTo(index)}
                />
              ))}
            </div>
            <span className="course-path__irl-counter">
              {activeIndex + 1} / {scenarios.length}
            </span>
          </div>

          <button
            type="button"
            className="course-path__irl-arrow"
            onClick={goNext}
            disabled={activeIndex === scenarios.length - 1}
            aria-label="Siguiente situación"
          >
            <ChevronRight size={18} aria-hidden />
          </button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}

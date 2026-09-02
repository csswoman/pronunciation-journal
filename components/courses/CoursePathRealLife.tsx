"use client";

// Planned structure:
// <CoursePathRealLife>
//   <header (intro + counter)>
//   <stage / CoursePathRealLifeCard>
//   <nav (arrows + dots)>
// </CoursePathRealLife>

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, MapPin } from "@/components/icons";
import { cn } from "@/lib/cn";
import type { RealLifeScenario } from "@/lib/courses/types";
import CoursePathRealLifeCard from "@/components/courses/CoursePathRealLifeCard";

interface CoursePathRealLifeProps {
  scenarios: RealLifeScenario[];
}

export default function CoursePathRealLife({ scenarios }: CoursePathRealLifeProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(true);
  const hasMultiple = scenarios.length > 1;
  const active = scenarios[activeIndex] ?? scenarios[0];

  useEffect(() => {
    setActiveIndex(0);
  }, [scenarios]);

  const goTo = useCallback(
    (index: number) => {
      setActiveIndex(Math.max(0, Math.min(scenarios.length - 1, index)));
    },
    [scenarios.length],
  );

  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);
  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);

  if (!active) return null;

  return (
    <section className="course-path__aside-card course-path__irl" aria-labelledby="course-path-irl-title">
      <button
        type="button"
        className="course-path__aside-card-toggle"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        <div className="course-path__aside-card-head">
          <div className="course-path__aside-card-icon-box" aria-hidden="true">
            <MapPin size={18} />
          </div>
          <div className="course-path__aside-card-heading">
            <div className="course-path__aside-card-title-row">
              <h3 id="course-path-irl-title" className="course-path__aside-card-title">
                Situaciones reales
              </h3>
              <ChevronDown
                size={16}
                className={cn(
                  "course-path__aside-card-chevron",
                  isOpen && "course-path__aside-card-chevron--open"
                )}
                aria-hidden
              />
            </div>
            <p className="course-path__aside-card-sub">
              Frases listas para usar este nivel en una conversación.
            </p>
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="course-path__irl-body">
          <div className="course-path__irl-head-top">
            <p className="course-path__irl-kicker">En contexto</p>
            {hasMultiple ? (
              <span
                className="course-path__irl-counter"
                aria-label={`${activeIndex + 1} de ${scenarios.length}`}
              >
                {activeIndex + 1}/{scenarios.length}
              </span>
            ) : null}
          </div>
          <div className="course-path__irl-stage" aria-live="polite">
            <div className="course-path__irl-viewport">
              <CoursePathRealLifeCard key={active.id} scenario={active} />
            </div>
          </div>

      {hasMultiple ? (
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
      ) : null}
        </div>
      )}
    </section>
  );
}

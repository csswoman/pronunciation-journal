"use client";

/*
 * Planned subcomponents:
 * - CoursePathAsideProgress (sidebar dashboard matching target layout design)
 *   - LevelOverallProgress (Percentage ring + completed count + remaining hours)
 *   - CheckpointMilestone (Next hito progress bar towards Checkpoint)
 *   - ReviewTopicsList (Para repasar section with retention bars + CTA button)
 *   - WeeklyStreakTracker (Esta semana 7-day streak dots)
 */

import Link from "next/link";
import { ArrowRight, MicVocal, RotateCcw } from "@/components/icons";
import type { CoursePathLevel, CoursePathTrackId } from "@/lib/courses/types";

interface ReviewTopicItem {
  id: string;
  title: string;
  retentionPercent: number;
}

interface CoursePathAsideProgressProps {
  level: CoursePathLevel;
  selectedLevelId: CoursePathTrackId;
  completedCount: number;
  totalCount: number;
  completedIds?: Set<string>;
}

const DEFAULT_REVIEW_TOPICS: ReviewTopicItem[] = [
  { id: "to-be", title: "Verbo to be", retentionPercent: 40 },
  { id: "articles", title: "Artículos a / an", retentionPercent: 60 },
  { id: "plurals", title: "Plurales irregulares", retentionPercent: 65 },
];

const DAYS_OF_WEEK = ["L", "M", "M", "J", "V", "S", "D"];
const ACTIVE_DAYS = [true, true, false, true, true, false, false];

export default function CoursePathAsideProgress({
  level,
  selectedLevelId,
  completedCount,
  totalCount,
}: CoursePathAsideProgressProps) {
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const hoursLeft = Math.max(0, Math.round((1 - percent / 100) * 18));
  const remainingLessons = Math.max(0, totalCount - completedCount);

  // SVG circular arc progress
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - percent / 100);

  return (
    <aside className="course-path__aside-progress" aria-label="Resumen y progreso de aprendizaje">
      {/* 0. Pronunciacion Quick Access */}
      <Link href="/courses/pronunciation" className="course-path__aside-card course-path__pronunciation-card">
        <div className="course-path__aside-card-head">
          <div className="course-path__aside-card-icon-box course-path__aside-card-icon-box--amber" aria-hidden="true">
            <MicVocal size={18} />
          </div>
          <div className="course-path__aside-card-heading">
            <h3 className="course-path__aside-card-title">Pronunciacion</h3>
            <p className="course-path__aside-card-sub">4 palabras guardadas para practicar</p>
          </div>
        </div>
      </Link>

      {/* 1. Overall Level Progress */}
      <section className="course-path__aside-card course-path__aside-progress-card">
        <h3 className="course-path__aside-card-title">Tu progreso en {level.spineLabel}</h3>
        <div className="course-path__aside-progress-row">
          <div className="course-path__aside-ring-wrap">
            <svg width="72" height="72" viewBox="0 0 72 72" className="course-path__aside-ring-svg">
              <circle
                cx="36"
                cy="36"
                r={radius}
                fill="none"
                stroke="var(--surface-sunken)"
                strokeWidth="5"
              />
              <circle
                cx="36"
                cy="36"
                r={radius}
                fill="none"
                stroke="var(--primary)"
                strokeWidth="5.5"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform="rotate(-90 36 36)"
              />
            </svg>
            <span className="course-path__aside-ring-text">{percent}%</span>
          </div>
          <div className="course-path__aside-progress-info">
            <span className="course-path__aside-progress-count">
              {completedCount} de {totalCount} lecciones
            </span>
            <span className="course-path__aside-progress-sub">
              ~{hoursLeft} h restantes
            </span>
          </div>
        </div>
      </section>

      {/* 2. Siguiente hito / Checkpoint */}
      <section className="course-path__aside-card course-path__aside-milestone-card">
        <span className="course-path__aside-kicker">Siguiente hito</span>
        <h4 className="course-path__aside-title">Checkpoint · {level.title}</h4>
        <div className="course-path__aside-milestone-bar-wrap">
          <div
            className="course-path__aside-milestone-bar"
            style={{ width: `${Math.min(100, Math.max(15, percent + 20))}%` }}
          />
        </div>
        <p className="course-path__aside-milestone-sub">
          {remainingLessons === 0
            ? "¡Nivel completado! Listo para evaluación."
            : `te faltan ${Math.min(2, remainingLessons)} lecciones para el checkpoint`}
        </p>
        <Link
          href={`/assessment?mode=checkpoint&level=${selectedLevelId}`}
          className="course-path__aside-milestone-link"
        >
          <span>Ir al Checkpoint</span>
          <ArrowRight size={14} aria-hidden />
        </Link>
      </section>

      {/* 3. Para repasar */}
      <section className="course-path__aside-card course-path__aside-review-card">
        <div className="course-path__aside-card-head">
          <div>
            <div className="course-path__aside-review-title-row">
              <h3 className="course-path__aside-card-title">Para repasar</h3>
              <span className="course-path__aside-review-badge">3</span>
            </div>
            <p className="course-path__aside-card-sub">Temas que se te resistieron.</p>
          </div>
        </div>

        <ul className="course-path__aside-review-topics">
          {DEFAULT_REVIEW_TOPICS.map((topic) => (
            <li key={topic.id} className="course-path__aside-review-topic-item">
              <div className="course-path__aside-review-topic-head">
                <span className="course-path__aside-review-topic-title">{topic.title}</span>
                <span className="course-path__aside-review-topic-pct">{topic.retentionPercent}%</span>
              </div>
              <div className="course-path__aside-review-topic-bar-bg">
                <div
                  className="course-path__aside-review-topic-bar"
                  style={{ width: `${topic.retentionPercent}%` }}
                />
              </div>
            </li>
          ))}
        </ul>

        <Link
          href={`/courses?level=${selectedLevelId}&mode=review`}
          className="course-path__aside-review-btn"
        >
          <RotateCcw size={14} aria-hidden />
          <span>Repasar los 3 · 5 min</span>
        </Link>
      </section>

      {/* 4. Esta semana (Streak) */}
      <section className="course-path__aside-card course-path__aside-streak-card">
        <div className="course-path__aside-card-head">
          <h3 className="course-path__aside-card-title">Esta semana</h3>
          <span className="course-path__aside-streak-count">4 días</span>
        </div>
        <div className="course-path__aside-streak-dots">
          {DAYS_OF_WEEK.map((day, idx) => {
            const isActive = ACTIVE_DAYS[idx];
            return (
              <div key={idx} className="course-path__aside-streak-col">
                <div
                  className={`course-path__aside-streak-dot ${
                    isActive ? "course-path__aside-streak-dot--active" : ""
                  }`}
                />
                <span className="course-path__aside-streak-day">{day}</span>
              </div>
            );
          })}
        </div>
      </section>
    </aside>
  );
}

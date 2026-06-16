"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import type { CefrLevelId, CoursePathCurriculum } from "@/lib/courses/types";
import CoursePathLevelPanel from "@/components/courses/CoursePathLevelPanel";
import { CoursePathLegendIconDisplay } from "@/components/courses/CoursePathIcons";
import { MicVocal, ArrowRight, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { db } from "@/lib/db";

const DEFAULT_LEVEL: CefrLevelId = "a1";

interface CoursePathPageProps {
  curriculum: CoursePathCurriculum;
}

export default function CoursePathPage({ curriculum }: CoursePathPageProps) {
  const [levelId, setLevelId] = useState<CefrLevelId>(DEFAULT_LEVEL);
  const [allOpenUnits, setAllOpenUnits] = useState<Record<string, Record<string, boolean>>>({});
  const [whyOpen, setWhyOpen] = useState(false);

  // Auto-select the user's active level on mount
  useEffect(() => {
    db.completedLessons.toArray().then((rows) => {
      if (rows.length === 0) return;
      const counts: Record<string, number> = {};
      for (const r of rows) counts[r.courseSlug] = (counts[r.courseSlug] ?? 0) + 1;
      const levelIds = curriculum.levels.map((l) => l.id);
      // Find the deepest level that has any progress
      const activeLevel = [...levelIds].reverse().find((id) => counts[id] > 0);
      if (activeLevel) setLevelId(activeLevel as CefrLevelId);
    }).catch(() => {});
  }, [curriculum.levels]);

  const openUnitsForLevel = allOpenUnits[levelId] ?? {};
  const setOpenUnitsForLevel = useCallback(
    (updater: (prev: Record<string, boolean>) => Record<string, boolean>) => {
      setAllOpenUnits((all) => ({ ...all, [levelId]: updater(all[levelId] ?? {}) }));
    },
    [levelId]
  );

  const level = curriculum.levels.find((l) => l.id === levelId)!;

  return (
    <div className="course-path">
      <div className="course-path__wrap">
        <header className="course-path__hero">
          <h1 className="course-path__title">Your English path</h1>
          <p className="course-path__intro">
            Pick your level and follow the core spine. Starred lessons are the priority path;
            everything else deepens what you know. Pronunciation runs alongside in Sound Lab.
          </p>
        </header>

        <div className="course-path__spine" role="tablist" aria-label="CEFR level">
          {curriculum.levels.map((lv) => (
            <button
              key={lv.id}
              id={`tab-${lv.id}`}
              type="button"
              role="tab"
              aria-selected={levelId === lv.id}
              aria-controls="course-level-panel"
              className={cn(
                "course-path__level",
                levelId === lv.id && "course-path__level--on"
              )}
              onClick={() => setLevelId(lv.id as CefrLevelId)}
            >
              <div className="course-path__level-lv">{lv.spineLabel}</div>
            </button>
          ))}
        </div>

        <div
          key={levelId}
          id="course-level-panel"
          role="tabpanel"
          aria-labelledby={`tab-${levelId}`}
          className="course-path__panel-enter"
        >
          <CoursePathLevelPanel
            level={level}
            openUnits={openUnitsForLevel}
            onToggleUnit={setOpenUnitsForLevel}
            electiveTracks={curriculum.electiveTracks}
          />
        </div>

        <div className="course-path__why">
          <button
            type="button"
            className="course-path__why-summary"
            onClick={() => setWhyOpen((v) => !v)}
            aria-expanded={whyOpen}
          >
            <ChevronRight
              className={cn("course-path__why-chev", whyOpen && "course-path__why-chev--open")}
              size={15}
              aria-hidden
            />
            <span>{curriculum.why.title}</span>
          </button>
          {whyOpen && (
            <div className="course-path__why-body">
              {curriculum.why.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
              <Link href="/practice/sounds" className="course-path__sound-lab-cta">
                <MicVocal size={16} strokeWidth={2} aria-hidden />
                Go to Sound Lab
                <ArrowRight size={14} aria-hidden />
              </Link>
            </div>
          )}
        </div>

        <div className="course-path__legend" role="list" aria-label="Icon legend">
          {curriculum.legend.map((item) => (
            <div key={item.icon} className="course-path__lg" role="listitem">
              <CoursePathLegendIconDisplay icon={item.icon} />
              <span>{item.description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

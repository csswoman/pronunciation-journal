"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { COURSE_PATH_CURRICULUM } from "@/lib/courses/curriculum";
import type { CefrLevelId } from "@/lib/courses/types";
import CoursePathLevelPanel from "@/components/courses/CoursePathLevelPanel";
import { CoursePathLegendIconDisplay } from "@/components/courses/CoursePathIcons";
import { MicVocal, ArrowRight, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

const DEFAULT_LEVEL: CefrLevelId = "a1";

export default function CoursePathPage() {
  const [levelId, setLevelId] = useState<CefrLevelId>(DEFAULT_LEVEL);
  const [allOpenUnits, setAllOpenUnits] = useState<Record<string, Record<string, boolean>>>({});

  const openUnitsForLevel = allOpenUnits[levelId] ?? {};
  const setOpenUnitsForLevel = useCallback(
    (updater: (prev: Record<string, boolean>) => Record<string, boolean>) => {
      setAllOpenUnits((all) => ({ ...all, [levelId]: updater(all[levelId] ?? {}) }));
    },
    [levelId]
  );

  const level = COURSE_PATH_CURRICULUM.levels.find((l) => l.id === levelId)!;

  return (
    <div className="course-path">
      <div className="course-path__wrap">
        <header className="course-path__hero">
          <span className="course-path__eyebrow">
            Curated curriculum for your goals
          </span>
          <h1 className="course-path__title">Your English path</h1>
          <p className="course-path__intro">
            93 courses across 7 tracks. Starred items are the core spine; everything else is
            extended curriculum for later. Pronunciation runs in parallel in Sound Lab.
          </p>
        </header>

        <div className="course-path__legend" role="list">
          {COURSE_PATH_CURRICULUM.legend.map((item) => (
            <div key={item.icon} className="course-path__lg" role="listitem">
              <CoursePathLegendIconDisplay icon={item.icon} />
              <span>{item.description}</span>
            </div>
          ))}
        </div>

        <details className="course-path__why">
          <summary className="course-path__why-summary">
            <ChevronRight className="course-path__why-chev" size={15} aria-hidden />
            <span>{COURSE_PATH_CURRICULUM.why.title}</span>
          </summary>
          <div className="course-path__why-body">
            {COURSE_PATH_CURRICULUM.why.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            <Link href="/practice/sounds" className="course-path__sound-lab-cta">
              <MicVocal size={16} strokeWidth={2} aria-hidden />
              Go to Sound Lab
              <ArrowRight size={14} aria-hidden />
            </Link>
          </div>
        </details>

        <div className="course-path__spine" role="tablist" aria-label="CEFR level">
          {COURSE_PATH_CURRICULUM.levels.map((lv) => (
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
              <div className="course-path__level-ln">{lv.spineSubtitle}</div>
            </button>
          ))}
        </div>

        <div
          id="course-level-panel"
          role="tabpanel"
          aria-labelledby={`tab-${levelId}`}
        >
          <CoursePathLevelPanel
            level={level}
            openUnits={openUnitsForLevel}
            onToggleUnit={setOpenUnitsForLevel}
            electiveTracks={COURSE_PATH_CURRICULUM.electiveTracks}
          />
        </div>


</div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { COURSE_PATH_CURRICULUM } from "@/lib/courses/curriculum";
import type { CefrLevelId } from "@/lib/courses/types";
import CoursePathLevelPanel from "@/components/courses/CoursePathLevelPanel";
import CoursePathElectiveTrack from "@/components/courses/CoursePathElectiveTrack";
import { CoursePathLegendIconDisplay } from "@/components/courses/CoursePathIcons";
import { MicVocal, ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";

const DEFAULT_LEVEL: CefrLevelId = "a1";

export default function CoursePathPage() {
  const [levelId, setLevelId] = useState<CefrLevelId>(DEFAULT_LEVEL);

  const level = COURSE_PATH_CURRICULUM.levels.find((l) => l.id === levelId)!;

  return (
    <div className="course-path">
      <div className="course-path__wrap">
        <header className="course-path__hero">
          <span className="course-path__eyebrow">
            Currículo curado para tu objetivo
          </span>
          <h1 className="course-path__title">Tu ruta de inglés</h1>
          <p className="course-path__intro">
            93 cursos en 7 rutas. Lo marcado con estrella es la columna vertebral; lo demás queda
            como currículo amplio, para después. La pronunciación corre en paralelo en Sound Lab.
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

        <div className="course-path__spine" role="tablist" aria-label="Nivel CEFR">
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
          <CoursePathLevelPanel key={levelId} level={level} />
        </div>

        <section className="course-path__electives" aria-labelledby="electives-heading">
          <h2 id="electives-heading" className="course-path__electives-title">
            Después de C1<span aria-hidden> · </span>rutas complementarias
          </h2>
          <p className="course-path__electives-sub">
            Propósitos específicos e inglés de negocios. Opcionales dentro de cada bloque aparecen al
            final de la lista.
          </p>
          <div className="course-path__rutas">
            {COURSE_PATH_CURRICULUM.electiveTracks.map((track, i) => (
              <CoursePathElectiveTrack key={track.id} level={track} defaultOpen={i === 0} />
            ))}
          </div>
        </section>

        <aside className="course-path__why">
          <h3>{COURSE_PATH_CURRICULUM.why.title}</h3>
          {COURSE_PATH_CURRICULUM.why.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          <Link href="/practice/sounds" className="course-path__sound-lab-cta">
            <MicVocal size={16} strokeWidth={2} aria-hidden />
            Ir a Sound Lab
            <ArrowRight size={14} aria-hidden />
          </Link>
        </aside>
      </div>
    </div>
  );
}

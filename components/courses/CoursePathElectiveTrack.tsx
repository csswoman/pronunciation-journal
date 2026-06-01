"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import type { CoursePathLevel } from "@/lib/courses/types";
import { countPriorityLessons } from "@/lib/courses/buildCurriculum";
import CoursePathLevelPanel from "@/components/courses/CoursePathLevelPanel";
import {
  CoursePathElectiveSpineIcon,
  CoursePathPriorityCount,
} from "@/components/courses/CoursePathIcons";

interface CoursePathElectiveTrackProps {
  level: CoursePathLevel;
  defaultOpen?: boolean;
}

export default function CoursePathElectiveTrack({ level, defaultOpen }: CoursePathElectiveTrackProps) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const nPriority = countPriorityLessons(level);
  const totalCourses = level.units.flatMap((u) => u.lessons).length;

  return (
    <div className={cn("course-path__ruta", open && "course-path__ruta--open")}>
      <button
        type="button"
        className="course-path__rrow"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className="course-path__lvb course-path__lvb--spec">
          {level.spineIcon ? (
            <CoursePathElectiveSpineIcon icon={level.spineIcon} />
          ) : (
            level.spineLabel
          )}
        </div>
        <div className="course-path__rinfo">
          <div className="course-path__rt">{level.title}</div>
          <div className="course-path__rm">
            <span>{totalCourses} cursos</span>
            {level.hours && <span>{level.hours}</span>}
            <CoursePathPriorityCount count={nPriority} className="course-path__rm-star" />
          </div>
        </div>
        <ChevronRight className="course-path__rchev" size={18} aria-hidden />
      </button>

      {open && (
        <div className="course-path__ruta-body">
          <CoursePathLevelPanel level={level} compactHead />
        </div>
      )}
    </div>
  );
}

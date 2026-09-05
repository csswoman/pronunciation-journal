"use client";

/*
 * Planned subcomponents:
 * - CoursePathMainCard (main card container for core unit lessons)
 *   - CoursePathLessonGroup (pending lesson groups)
 *   - CoursePathLessonGroup (completed lesson group if any)
 */

import CoursePathLessonGroup, { type LessonWithState } from "@/components/courses/CoursePathLessonGroup";
import type { DerivedUnitView } from "@/lib/courses/progress";
import type { CoursePathTrackId } from "@/lib/courses/types";

interface CoursePathMainCardProps {
  unit: DerivedUnitView;
  levelId: CoursePathTrackId;
  firstLessonId: string | undefined;
  completedIdsCount: number;
  expandedGroups: Record<string, boolean>;
  onToggle: (id: string, open: boolean) => void;
  downloadedIds: Set<string>;
}

function groupPendingLessons(lessons: LessonWithState[]): Array<{ group: string; lessons: LessonWithState[] }> {
  return lessons.reduce<Array<{ group: string; lessons: LessonWithState[] }>>((groups, lesson) => {
    const group = lesson.group ?? "Contenido del curso";
    const lastGroup = groups.at(-1);
    if (lastGroup?.group === group) {
      lastGroup.lessons.push(lesson);
    } else {
      groups.push({ group, lessons: [lesson] });
    }
    return groups;
  }, []);
}

export default function CoursePathMainCard({
  unit,
  levelId,
  firstLessonId,
  completedIdsCount,
  expandedGroups,
  onToggle,
  downloadedIds,
}: CoursePathMainCardProps) {
  const pendingGroups = groupPendingLessons(
    unit.lessons.filter((lesson: LessonWithState) => {
      const isDuplicatedStart = completedIdsCount === 0 && lesson.id === firstLessonId;
      return lesson.state !== "done" && !isDuplicatedStart;
    })
  );

  return (
    <div className="course-path__main-card">
      {pendingGroups.map(({ group, lessons }, index) => {
        const id = `${unit.unit.id}-${group}-${index}`;
        const hasCurrentLesson = lessons.some((lesson: LessonWithState) => lesson.state === "current");
        return (
          <CoursePathLessonGroup
            key={id}
            id={id}
            title={group}
            lessons={lessons}
            levelId={levelId}
            open={expandedGroups[id] ?? (hasCurrentLesson || index === 0)}
            onToggle={onToggle}
            downloadedIds={downloadedIds}
          />
        );
      })}
      {unit.lessons.some((lesson: LessonWithState) => lesson.state === "done") && (() => {
        const id = `${unit.unit.id}-completed`;
        const lessons = unit.lessons.filter((lesson: LessonWithState) => lesson.state === "done");
        return (
          <CoursePathLessonGroup
            id={id}
            title="Completadas"
            lessons={lessons}
            levelId={levelId}
            open={expandedGroups[id] ?? false}
            onToggle={onToggle}
            completed
            downloadedIds={downloadedIds}
          />
        );
      })()}
    </div>
  );
}

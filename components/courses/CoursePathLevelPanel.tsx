/*
 * Planned subcomponents:
 * - CoursePathLevelPanel
 *   - CoursePathProgressClient (integrates main curriculum, electives and aside)
 */

import CoursePathProgressClient from "@/components/courses/CoursePathProgressClient";
import type { CoursePathLevel } from "@/lib/courses/types";

interface CoursePathLevelPanelProps {
  level: CoursePathLevel;
  compactHead?: boolean;
  hideAside?: boolean;
  electiveTracks?: CoursePathLevel[];
}

export default function CoursePathLevelPanel({
  level,
  compactHead,
  hideAside,
  electiveTracks,
}: CoursePathLevelPanelProps) {
  return (
    <CoursePathProgressClient
      level={level}
      compactHead={compactHead}
      hideAside={hideAside}
      electiveTracks={level.id === "c1" ? electiveTracks : undefined}
    />
  );
}

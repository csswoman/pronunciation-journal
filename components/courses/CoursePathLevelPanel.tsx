/*
 * Planned subcomponents:
 * - CoursePathLevelPanel
 *   - CoursePathProgressClient (integrates main curriculum, electives and aside)
 */

import CoursePathProgressClient from "@/components/courses/CoursePathProgressClient";
import type { CoursePathLevel } from "@/lib/courses/types";
import type { ImmersionLesson } from "@/lib/immersion/types";

interface CoursePathLevelPanelProps {
  level: CoursePathLevel;
  compactHead?: boolean;
  hideAside?: boolean;
  electiveTracks?: CoursePathLevel[];
  topicImmersionMap?: Record<string, ImmersionLesson>;
}

export default function CoursePathLevelPanel({
  level,
  compactHead,
  hideAside,
  electiveTracks,
  topicImmersionMap,
}: CoursePathLevelPanelProps) {
  return (
    <CoursePathProgressClient
      level={level}
      compactHead={compactHead}
      hideAside={hideAside}
      electiveTracks={electiveTracks}
      topicImmersionMap={topicImmersionMap}
    />
  );
}

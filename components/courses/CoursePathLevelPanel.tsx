import CoursePathC1Electives from "@/components/courses/CoursePathC1Electives";
import CoursePathProgressClient from "@/components/courses/CoursePathProgressClient";
import type { CoursePathLevel } from "@/lib/courses/types";

interface CoursePathLevelPanelProps {
  level: CoursePathLevel;
  compactHead?: boolean;
  electiveTracks?: CoursePathLevel[];
}

export default function CoursePathLevelPanel({ level, compactHead, electiveTracks }: CoursePathLevelPanelProps) {
  return (
    <>
      <CoursePathProgressClient level={level} compactHead={compactHead} />

      {level.id === "c1" && electiveTracks && electiveTracks.length > 0 && (
        <CoursePathC1Electives tracks={electiveTracks} />
      )}
    </>
  );
}

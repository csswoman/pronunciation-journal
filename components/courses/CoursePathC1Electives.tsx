"use client";

import CoursePathElectiveTrack from "@/components/courses/CoursePathElectiveTrack";
import type { CoursePathLevel } from "@/lib/courses/types";
import type { ImmersionLesson } from "@/lib/immersion/types";

interface CoursePathC1ElectivesProps {
  tracks: CoursePathLevel[];
  topicImmersionMap?: Record<string, ImmersionLesson>;
}

export default function CoursePathC1Electives({
  tracks,
  topicImmersionMap,
}: CoursePathC1ElectivesProps) {
  return (
    <section className="course-path__c1-electives mt-8">
      <h3 className="course-path__c1-electives-title text-h3 font-bold text-fg mb-4">
        Rutas opcionales y especializadas
      </h3>
      <div className="course-path__rutas" aria-label="Rutas opcionales">
        {tracks.map((track, i) => (
          <CoursePathElectiveTrack
            key={track.id}
            level={track}
            defaultOpen={i === 0}
            topicImmersionMap={topicImmersionMap}
            hideHero
          />
        ))}
      </div>
    </section>
  );
}

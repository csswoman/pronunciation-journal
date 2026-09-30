"use client";

import CoursePathElectiveTrack from "@/components/courses/CoursePathElectiveTrack";
import type { CoursePathLevel } from "@/lib/courses/types";
import type { ImmersionLesson } from "@/lib/immersion/types";
import { cn } from "@/lib/cn";

interface CoursePathC1ElectivesProps {
  tracks: CoursePathLevel[];
  topicImmersionMap?: Record<string, ImmersionLesson>;
  completedIds?: Set<string>;
  downloadedIds?: Set<string>;
  isStandaloneTab?: boolean;
}

export default function CoursePathC1Electives({
  tracks,
  topicImmersionMap,
  completedIds,
  downloadedIds,
  isStandaloneTab = false,
}: CoursePathC1ElectivesProps) {
  return (
    <section
      className={cn(
        "course-path__c1-electives",
        isStandaloneTab ? "mt-2" : "mt-8"
      )}
      aria-label="Cursos y rutas opcionales"
    >
      {!isStandaloneTab && (
        <h3 className="course-path__c1-electives-title text-h3 font-bold text-fg mb-4">
          Rutas opcionales y especializadas
        </h3>
      )}
      <div className="course-path__rutas" aria-label="Rutas opcionales">
        {tracks.map((track, i) => (
          <CoursePathElectiveTrack
            key={track.id}
            level={track}
            defaultOpen={i === 0}
            topicImmersionMap={topicImmersionMap}
            completedIds={completedIds}
            downloadedIds={downloadedIds}
          />
        ))}
      </div>
    </section>
  );
}

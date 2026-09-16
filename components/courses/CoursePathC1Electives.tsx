// Planned structure:
// <CoursePathC1Electives>
//   <header>
//   <CoursePathElectiveTrack /> × n
// </CoursePathC1Electives>

import type { CoursePathLevel } from "@/lib/courses/types";
import type { ImmersionLesson } from "@/lib/immersion/types";
import CoursePathElectiveTrack from "@/components/courses/CoursePathElectiveTrack";

interface CoursePathC1ElectivesProps {
  tracks: CoursePathLevel[];
  topicImmersionMap?: Record<string, ImmersionLesson>;
}

export default function CoursePathC1Electives({ tracks, topicImmersionMap }: CoursePathC1ElectivesProps) {
  return (
    <section className="course-path__c1-electives" aria-labelledby="c1-electives-heading">
      <h3 id="c1-electives-heading" className="course-path__c1-electives-title">
        Rutas opcionales y especializadas
      </h3>
      <p className="course-path__c1-electives-sub">
        Inglés para tu trabajo, tu sector, pronunciación y habla conectada. Las lecciones opcionales
        de cada ruta están al final de la lista.
      </p>
      <div className="course-path__rutas">
        {tracks.map((track, i) => (
          <CoursePathElectiveTrack key={track.id} level={track} defaultOpen={i === 0} topicImmersionMap={topicImmersionMap} />
        ))}
      </div>
    </section>
  );
}

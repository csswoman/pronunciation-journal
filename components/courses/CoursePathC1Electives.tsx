// Planned structure:
// <CoursePathC1Electives>
//   <header>
//   <CoursePathElectiveTrack /> × n
// </CoursePathC1Electives>

import type { CoursePathLevel } from "@/lib/courses/types";
import CoursePathElectiveTrack from "@/components/courses/CoursePathElectiveTrack";

interface CoursePathC1ElectivesProps {
  tracks: CoursePathLevel[];
}

export default function CoursePathC1Electives({ tracks }: CoursePathC1ElectivesProps) {
  return (
    <section className="course-path__c1-electives" aria-labelledby="c1-electives-heading">
      <h3 id="c1-electives-heading" className="course-path__c1-electives-title">
        After C1<span aria-hidden> · </span>elective tracks
      </h3>
      <p className="course-path__c1-electives-sub">
        Specific purposes and business English. Optional courses within each track appear at the end
        of each list.
      </p>
      <div className="course-path__rutas">
        {tracks.map((track, i) => (
          <CoursePathElectiveTrack key={track.id} level={track} defaultOpen={i === 0} />
        ))}
      </div>
    </section>
  );
}

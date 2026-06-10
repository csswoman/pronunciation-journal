// Planned structure:
// <CoursePathRealLifeCard>
//   <header (emoji + title)>
//   <phrases list>
//   <vocab list>
// </CoursePathRealLifeCard>

import type { RealLifeScenario } from "@/lib/courses/types";

interface CoursePathRealLifeCardProps {
  scenario: RealLifeScenario;
}

export default function CoursePathRealLifeCard({ scenario }: CoursePathRealLifeCardProps) {
  return (
    <div className="course-path__irl-card">
      <div className="course-path__irl-card-head">
        {scenario.emoji && <span aria-hidden>{scenario.emoji}</span>}
        <span>{scenario.title}</span>
      </div>
      <ul className="course-path__irl-phrases" aria-label="Example phrases">
        {scenario.phrases.map((phrase, i) => (
          <li key={i}>{phrase}</li>
        ))}
      </ul>
      <dl className="course-path__irl-vocab">
        {scenario.vocab.map((item) => (
          <div key={item.word} className="course-path__irl-vocab-row">
            <dt>{item.word}</dt>
            <dd>{item.meaning}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

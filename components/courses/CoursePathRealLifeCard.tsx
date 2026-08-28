// Planned structure:
// <CoursePathRealLifeCard>
//   <header (icon badge + title)>
//   <phrases section>
//   <vocab box (sunken panel with 2-col dl)>
// </CoursePathRealLifeCard>

import { CoursePathRealLifeIcon } from "@/components/courses/CoursePathIcons";
import type { RealLifeScenario } from "@/lib/courses/types";

interface CoursePathRealLifeCardProps {
  scenario: RealLifeScenario;
}

export default function CoursePathRealLifeCard({ scenario }: CoursePathRealLifeCardProps) {
  return (
    <article className="course-path__irl-card">
      <header className="course-path__irl-card-head">
        <span className="course-path__irl-icon" aria-hidden>
          <CoursePathRealLifeIcon icon={scenario.icon} size={18} />
        </span>
        <h4 className="course-path__irl-card-title">{scenario.title}</h4>
      </header>

      <section className="course-path__irl-phrases-block" aria-labelledby={`${scenario.id}-phrases`}>
        <h5 id={`${scenario.id}-phrases`} className="course-path__irl-card-label">
          Frases
        </h5>
        <ul className="course-path__irl-phrases">
          {scenario.phrases.map((phrase, i) => (
            <li key={i} className="course-path__irl-phrase">
              <span className="course-path__irl-phrase-num" aria-hidden>
                {i + 1}
              </span>
              <span className="course-path__irl-phrase-text">{phrase}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="course-path__irl-vocab-box" aria-labelledby={`${scenario.id}-vocab`}>
        <h5 id={`${scenario.id}-vocab`} className="course-path__irl-card-label">
          Vocabulario
        </h5>
        <dl className="course-path__irl-vocab">
          {scenario.vocab.map((item) => (
            <div key={item.word} className="course-path__irl-vocab-item">
              <dt className="course-path__irl-vocab-term">{item.word}</dt>
              <dd className="course-path__irl-vocab-def">{item.meaning}</dd>
            </div>
          ))}
        </dl>
      </section>
    </article>
  );
}

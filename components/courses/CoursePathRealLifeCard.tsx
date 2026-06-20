// Planned structure:
// <CoursePathRealLifeCard>
//   <header (emoji badge + title)>
//   <phrases list>
//   <vocab grid>
// </CoursePathRealLifeCard>

import type { RealLifeScenario } from "@/lib/courses/types";

interface CoursePathRealLifeCardProps {
  scenario: RealLifeScenario;
}

export default function CoursePathRealLifeCard({ scenario }: CoursePathRealLifeCardProps) {
  return (
    <article className="course-path__irl-card">
      <header className="course-path__irl-card-head">
        {scenario.emoji ? (
          <span className="course-path__irl-emoji" aria-hidden>
            {scenario.emoji}
          </span>
        ) : null}
        <div className="course-path__irl-card-intro">
          <p className="course-path__irl-card-kicker">Situación</p>
          <h4 className="course-path__irl-card-title">{scenario.title}</h4>
        </div>
      </header>

      <section className="course-path__irl-card-block" aria-labelledby={`${scenario.id}-phrases`}>
        <h5 id={`${scenario.id}-phrases`} className="course-path__irl-card-label">
          Frases útiles
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

      <section className="course-path__irl-card-block" aria-labelledby={`${scenario.id}-vocab`}>
        <h5 id={`${scenario.id}-vocab`} className="course-path__irl-card-label">
          Vocabulario clave
        </h5>
        <dl className="course-path__irl-vocab">
          {scenario.vocab.map((item) => (
            <div key={item.word} className="course-path__irl-vocab-item">
              <dt>{item.word}</dt>
              <dd>{item.meaning}</dd>
            </div>
          ))}
        </dl>
      </section>
    </article>
  );
}

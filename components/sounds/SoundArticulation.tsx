"use client";

import { useId, useState } from "react";
import { ChevronDown, ChevronUp } from "@/components/icons";

export function SoundArticulation({ articulation }: { articulation: string[] }) {
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();
  const headingId = useId();

  return (
    <section className="sound-detail__articulation" aria-labelledby={headingId}>
      <div className="sound-detail__section-toggle">
        <h3 id={headingId} className="ipa-chart__panel-sec m-0">Cómo decirlo</h3>
        <button
          type="button"
          className="sound-detail__collapse"
          aria-controls={contentId}
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
        <span className="sound-detail__collapse-label">
          {expanded ? "Ocultar cómo se produce" : "Ver cómo se produce"}
          {expanded ? (
            <ChevronUp size={14} aria-hidden />
          ) : (
            <ChevronDown size={14} aria-hidden />
          )}
        </span>
        </button>
      </div>
      <div id={contentId} className="ipa-chart__howto" hidden={!expanded}>
        {articulation.map((tip, index) => (
          <div key={`${tip}-${index}`} className="ipa-chart__howto-step">
            <span className="ipa-chart__howto-n">{index + 1}</span>
            <span>{tip}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

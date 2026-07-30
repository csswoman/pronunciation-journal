"use client";

import { useId } from "react";

export function SoundSpanishTip({ tip }: { tip: string }) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId}>
      <div className="ipa-chart__esnote">
        <h3 id={headingId} className="ipa-chart__esnote-h m-0">El truco</h3>
        <p className="sound-detail__tip-body">{tip}</p>
      </div>
    </section>
  );
}

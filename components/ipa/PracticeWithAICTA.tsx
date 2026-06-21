"use client";

import { useAICoachStore } from "@/lib/stores/aiCoachStore";

export default function PracticeWithAICTA({
  focusedSymbol,
}: {
  focusedSymbol: string;
}) {
  const openCoach = useAICoachStore((s) => s.openCoach);

  const handleOpenCoach = () => {
    openCoach({
      tab: "chat",
      prefill: `Ayúdame a practicar el sonido ${focusedSymbol}. Quiero una conversación corta con feedback de pronunciación.`,
    });
  };

  return (
    <section className="ipa-chart__ai">
      <div className="ipa-chart__ai-text">
        <b>Practica con IA</b>
        <p>
          Enfocada en <span className="font-ipa font-semibold">{focusedSymbol}</span>
        </p>
      </div>

      <button
        type="button"
        onClick={handleOpenCoach}
        className="ipa-chart__btn ipa-chart__btn--primary shrink-0"
      >
        <span aria-hidden>✦</span>
        Abrir coach
      </button>
    </section>
  );
}

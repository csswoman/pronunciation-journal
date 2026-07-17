"use client";

import { ArrowDown, Play } from "@/components/icons";
import PageHeader from "@/components/layout/PageHeader";

export default function IPAPageHeader({
  onStartPractice,
}: {
  onStartPractice?: () => void;
}) {
  const scrollToPractice = () => {
    document.getElementById("minimal-pairs")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <PageHeader
      kicker="Reference"
      title="IPA Chart"
      subtitle="Mapa de sonidos del inglés para practicar y consultar"
      primaryCta={
        onStartPractice
          ? {
              label: "Sound Lab",
              icon: <Play size={14} fill="currentColor" aria-hidden />,
              onClick: onStartPractice,
            }
          : undefined
      }
      secondaryCta={{
        label: "Practicar aquí",
        icon: <ArrowDown size={14} aria-hidden />,
        onClick: scrollToPractice,
        variant: "secondary",
      }}
    />
  );
}

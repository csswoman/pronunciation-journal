"use client";

import { ArrowDown, Play } from "@/components/icons";
import PageHeader from "@/components/layout/PageHeader";

export default function IPAPageHeader({
  onStartPractice,
}: {
  onStartPractice?: () => void;
}) {
  const scrollToPractice = () => {
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth";
    document.getElementById("minimal-pairs")?.scrollIntoView({ behavior });
  };

  return (
    <PageHeader
      kicker="Referencia"
      title="IPA Chart"
      subtitle="Mapa de sonidos del inglés para practicar y consultar"
      primaryCta={
        onStartPractice
          ? {
              label: "Laboratorio de sonidos",
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

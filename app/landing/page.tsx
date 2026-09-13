import type { Metadata } from "next";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingAdaptive } from "@/components/landing/LandingAdaptive";
import { LandingPractices } from "@/components/landing/LandingPractices";
import { LandingCoach } from "@/components/landing/LandingCoach";
import { LandingPhilosophy } from "@/components/landing/LandingPhilosophy";
import { LandingProgress } from "@/components/landing/LandingProgress";
import { LandingClose } from "@/components/landing/LandingClose";

export const metadata: Metadata = {
  title: "English Journal — entrena el oído, no solo la gramática",
  description:
    "Diario de pronunciación con grabación, evaluación determinista y repaso espaciado. 2.800 palabras esenciales, 110 sonidos y 66 mini-lecciones de A1 a C2.",
  openGraph: {
    title: "English Journal",
    description:
      "Entiendes el inglés escrito. Ahora entrena el oído. Práctica de pronunciación con progreso que puedes creer.",
    type: "website",
  },
};

export default function LandingPage() {
  return (
    <main className="min-h-dvh bg-[var(--bg)]">
      <LandingHero />
      <LandingAdaptive />
      <LandingPractices />
      <LandingCoach />
      <LandingPhilosophy />
      <LandingProgress />
      <LandingClose />
    </main>
  );
}

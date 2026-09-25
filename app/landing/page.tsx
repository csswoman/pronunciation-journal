import type { Metadata } from "next";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingStatsRow } from "@/components/landing/LandingStatsRow";
import { LandingPractices } from "@/components/landing/LandingPractices";
import { LandingCoach } from "@/components/landing/LandingCoach";
import { LandingProgress } from "@/components/landing/LandingProgress";
import { LandingClose } from "@/components/landing/LandingClose";
import { ScrollReveal } from "@/components/landing/ScrollReveal";

export const metadata: Metadata = {
  title: "English Journal — Lees inglés sin problema. Ahora que te entiendan.",
  description:
    "Un diario de pronunciación que escucha cómo hablas, detecta qué sonido se te escapa y decide qué practicas mañana. Sin mascotas, sin vidas, sin premios vacíos.",
  openGraph: {
    title: "English Journal",
    description:
      "Lees inglés sin problema. Ahora que te entiendan. Práctica de pronunciación con progreso que puedes creer.",
    type: "website",
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-[var(--bg)]">
      <LandingNav />
      <div className="mx-auto flex w-full max-w-6xl flex-col px-4 pb-16 sm:px-6 sm:pb-24 lg:px-8">
        <main className="mt-4 flex flex-col gap-20 sm:gap-28 lg:gap-32">
          {/* Hero & Stats block (cohesive visual unit) */}
          <ScrollReveal>
            <div className="flex flex-col gap-5 sm:gap-6">
              <LandingHero />
              <LandingStatsRow />
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <LandingPractices />
          </ScrollReveal>

          <ScrollReveal>
            <LandingCoach />
          </ScrollReveal>

          <ScrollReveal>
            <LandingProgress />
          </ScrollReveal>

          <ScrollReveal>
            <LandingClose />
          </ScrollReveal>
        </main>
      </div>
    </div>
  );
}

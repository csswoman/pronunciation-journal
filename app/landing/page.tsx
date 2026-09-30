import type { Metadata } from "next";
import { Hero } from "@/components/landing/Hero";
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
    <div className="min-h-dvh bg-[var(--bg)] text-[var(--text)]">
      {/* Complete Hero component with header, main card showcase and stats */}
      <Hero />

      <div className="mx-auto flex w-full max-w-[1440px] flex-col px-5 pb-16 sm:px-[40px] sm:pb-24">
        <main className="mt-12 flex flex-col gap-20 sm:gap-28 lg:gap-32">
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

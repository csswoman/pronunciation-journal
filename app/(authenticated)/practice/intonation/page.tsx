import type { Metadata } from "next";
import { IntonationTrainer } from "@/components/pronunciation/IntonationTrainer";

export const metadata: Metadata = {
  title: "Entonación y Curvas de Tono | English Journal",
  description: "Entrena la melodía y el tono de tus oraciones en inglés con visualización de tono en tiempo real.",
};

export default function IntonationPage() {
  return (
    <div className="page-shell page-shell--catalog layout-stack-md py-6">
      <header className="page-header max-w-4xl mx-auto w-full">
        <span className="font-kicker text-primary">Pronunciación & Melodía</span>
        <h1 className="text-h1 text-fg mt-1">Gráficas de Entonación</h1>
        <p className="text-body text-fg-muted max-w-2xl text-pretty mt-1">
          Compara la curva melódica de tu voz con los patrones nativos del inglés.
          Identifica cuándo subir el tono en preguntas ↗ y cuándo bajarlo en afirmaciones ↘.
        </p>
      </header>

      <main className="max-w-4xl mx-auto w-full">
        <IntonationTrainer />
      </main>
    </div>
  );
}

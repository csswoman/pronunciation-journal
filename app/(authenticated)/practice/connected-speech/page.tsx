import type { Metadata } from "next";
import Link from "next/link";
import PageLayout from "@/components/layout/PageLayout";
import { ConnectedSpeechTrainer } from "@/components/pronunciation/ConnectedSpeechTrainer";
import { ArrowLeft } from "@/components/icons";

export const metadata: Metadata = {
  title: "Habla Conectada y Enlaces | English Journal",
  description: "Entrena el enlace de palabras (linking), la Flap T americana y las formas débiles para sonar natural y entender el inglés rápido.",
};

export default function ConnectedSpeechPage() {
  return (
    <PageLayout archetype="session" className="layout-stack-md py-6">
      <div className="flex items-center justify-between">
        <Link
          href="/practice"
          className="inline-flex items-center gap-1.5 text-body-sm font-medium text-fg-muted transition-colors hover:text-fg focus-ring rounded py-1"
        >
          <ArrowLeft className="size-4" />
          <span>Volver al Hub de Práctica</span>
        </Link>
      </div>

      <header className="page-header w-full">
        <span className="font-kicker text-primary">Fluidez & Comprensión Auditiva</span>
        <h1 className="text-h1 text-fg mt-1">Habla Conectada y Enlaces</h1>
        <p className="text-body text-fg-muted max-w-2xl text-pretty mt-1">
          En inglés nativo las palabras nunca se pronuncian aisladas. Aprende cómo se encadenan
          las consonantes finales con las vocales siguientes para entender a los nativos a velocidad real.
        </p>
      </header>

      <main className="w-full">
        <ConnectedSpeechTrainer />
      </main>
    </PageLayout>
  );
}


import type { Metadata } from "next";
import { ConnectedSpeechTrainer } from "@/components/pronunciation/ConnectedSpeechTrainer";

export const metadata: Metadata = {
  title: "Habla Conectada y Enlaces | English Journal",
  description: "Entrena el enlace de palabras (linking), la Flap T americana y las formas débiles para sonar natural y entender el inglés rápido.",
};

export default function ConnectedSpeechPage() {
  return (
    <div className="page-shell page-shell--catalog layout-stack-md py-6">
      <header className="page-header max-w-4xl mx-auto w-full">
        <span className="font-kicker text-primary">Fluidez & Comprensión Auditiva</span>
        <h1 className="text-h1 text-fg mt-1">Habla Conectada y Enlaces</h1>
        <p className="text-body text-fg-muted max-w-2xl text-pretty mt-1">
          En inglés nativo las palabras nunca se pronuncian aisladas. Aprende cómo se encadenan
          las consonantes finales con las vocales siguientes para entender a los nativos a velocidad real.
        </p>
      </header>

      <main className="max-w-4xl mx-auto w-full">
        <ConnectedSpeechTrainer />
      </main>
    </div>
  );
}

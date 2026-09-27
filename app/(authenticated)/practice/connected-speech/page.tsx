import type { Metadata } from "next";
import PageLayout from "@/components/layout/PageLayout";
import { ConnectedSpeechTrainer } from "@/components/pronunciation/ConnectedSpeechTrainer";

export const metadata: Metadata = {
  title: "Habla Conectada y Enlaces | English Journal",
  description: "Entrena el enlace de palabras (linking), la Flap T americana y las formas débiles para sonar natural y entender el inglés rápido.",
};

export default function ConnectedSpeechPage() {
  return (
    <PageLayout archetype="catalog" className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <main className="w-full">
        <ConnectedSpeechTrainer />
      </main>
    </PageLayout>
  );
}


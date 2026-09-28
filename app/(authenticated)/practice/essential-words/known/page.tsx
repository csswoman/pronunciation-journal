import PageLayout from "@/components/layout/PageLayout";
import { KnownWordsTriage } from "@/components/practice/essential-words/known/KnownWordsTriage";

export const metadata = { title: "Triage de vocabulario — Essential Words" };

export default function KnownWordsPage() {
  return (
    <PageLayout archetype="catalog">
      <KnownWordsTriage />
    </PageLayout>
  );
}

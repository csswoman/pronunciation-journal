import { notFound } from "next/navigation";
import PageLayout from "@/components/layout/PageLayout";
import Section from "@/components/layout/Section";
import { WordBrowserClient } from "@/components/lexicon/lesson/WordBrowserClient";
import { getCategories, getCategoryWords } from "@/lib/lexicon/categories";
import { getCategoryBlurb } from "@/lib/lexicon/category-blurbs";
import { getLexiconWordBankDetails } from "@/lib/word-bank/server-queries";
import { deriveWordProgressSignal } from "@/lib/word-bank/progress-state";
import type { Word } from "@/components/lexicon/lesson/WordGrid";

export default async function LessonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const categories = getCategories();
  const category = categories.find((c) => c.id === id);
  if (!category) notFound();

  const rawWords = getCategoryWords(id);
  const lexiconIds = rawWords.map((w) => w.id);

  let wordBankDetailsMap: Awaited<ReturnType<typeof getLexiconWordBankDetails>>;
  try {
    wordBankDetailsMap = await getLexiconWordBankDetails(lexiconIds);
  } catch {
    wordBankDetailsMap = new Map();
  }

  function resolveStatus(wordId: string): "learned" | "reviewing" | "new" {
    const entry = wordBankDetailsMap.get(wordId);
    if (!entry) return "new";
    const signal = deriveWordProgressSignal({
      srs_status: entry.srsStatus ?? null,
      mastery_provenance: entry.masteryProvenance ?? null,
      objective_evidence_count: entry.objectiveEvidenceCount ?? null,
      familiarity_status: entry.familiarityStatus ?? null,
    } as Parameters<typeof deriveWordProgressSignal>[0]);
    if (signal === "mastered" || signal === "legacy_mastered") return "learned";
    if (signal === "familiar" || signal === "objective_evidence") return "reviewing";
    return "new"; // 'saved' = en word_bank pero sin práctica
  }

  const words: Word[] = rawWords.map((w) => ({
    id: w.id,
    word: w.word,
    partOfSpeech: w.pos,
    definition: w.definition,
    ipa: w.ipa,
    translation: w.translation,
    example: w.example,
    status: resolveStatus(w.id),
    difficulty: w.difficulty,
  }));

  return (
    <PageLayout archetype="catalog">
      <div className="lexicon-area">
        <Section spacing="lg">
          <WordBrowserClient
            words={words}
            categoryId={id}
            categoryTitle={category.name}
            blurb={getCategoryBlurb(id)}
            wordBankMapEntries={Array.from(wordBankDetailsMap.entries()).map(
              ([k, v]) => [k, { id: v.id, isFavorite: v.isFavorite }] as [string, { id: string; isFavorite: boolean }]
            )}
          />
        </Section>
      </div>
    </PageLayout>
  );
}

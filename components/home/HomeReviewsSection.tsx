import HomeSectionHeader from "@/components/home/HomeSectionHeader";
import HomeReviewQueueCard from "@/components/home/HomeReviewQueueCard";
import HomeRetentionCard from "@/components/home/HomeRetentionCard";
import type { WordBankEntry } from "@/lib/word-bank/types";
import type { WeakestPhonemeHome } from "@/lib/home/constants";
import type { LexiconRetentionStats } from "@/lib/lexicon/server-progress";

interface HomeReviewsSectionProps {
  words?: WordBankEntry[];
  dueCount?: number;
  lexicon?: LexiconRetentionStats | null;
  weakestPhoneme?: WeakestPhonemeHome | null;
}

export default function HomeReviewsSection({
  words,
  dueCount,
  lexicon,
  weakestPhoneme,
}: HomeReviewsSectionProps) {
  return (
    <section className="mt-10">
      <HomeSectionHeader
        number="02"
        title="Due for review"
        subtitle="spaced repetition · don't let it go cold"
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.7fr_1fr]">
        <HomeReviewQueueCard words={words} dueCount={dueCount} />
        <HomeRetentionCard lexicon={lexicon} weakestPhoneme={weakestPhoneme} />
      </div>
    </section>
  );
}

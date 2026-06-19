import HomeSectionHeader from "@/components/home/HomeSectionHeader";
import ReviewQueueIsland from "@/components/home/ReviewQueueIsland";
import ReviewProgressCard from "@/components/home/ReviewProgressCard";
import type { ReviewQueueSummary, WeakestPhonemeHome } from "@/lib/home/constants";
import type { LexiconRetentionStats } from "@/lib/lexicon/server-progress";

interface HomeReviewsSectionProps {
  reviewQueue: ReviewQueueSummary;
  lexicon?: LexiconRetentionStats | null;
  weakestPhoneme?: WeakestPhonemeHome | null;
}

export default function HomeReviewsSection({
  reviewQueue,
  lexicon,
  weakestPhoneme,
}: HomeReviewsSectionProps) {
  return (
    <section className="mt-14">
      <HomeSectionHeader
        number="02"
        title="Due for review"
        subtitle="spaced repetition · don't let it go cold"
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.7fr_1fr]">
        <ReviewQueueIsland serverSummary={reviewQueue} />
        <ReviewProgressCard lexicon={lexicon} weakestPhoneme={weakestPhoneme} />
      </div>
    </section>
  );
}

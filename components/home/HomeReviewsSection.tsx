import HomeSectionHeader from "@/components/home/HomeSectionHeader";
import ReviewQueueIsland from "@/components/home/ReviewQueueIsland";
import ReviewProgressCard from "@/components/home/ReviewProgressCard";
import Core1000ProgressCard from "@/components/home/Core1000ProgressCard";
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
        <div className="flex flex-col gap-4">
          <ReviewProgressCard lexicon={lexicon} weakestPhoneme={weakestPhoneme} />
          <Core1000ProgressCard />
        </div>
      </div>
    </section>
  );
}

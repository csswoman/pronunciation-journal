import { Zap } from "lucide-react";
import HomeSectionHeader from "@/components/home/HomeSectionHeader";
import HomeDailyCard from "@/components/home/HomeDailyCard";
import HomeQuickActionCard from "@/components/home/HomeQuickActionCard";
import HomeAiPracticeCard from "@/components/home/HomeAiPracticeCard";
import type { DailyStreakResult } from "@/lib/daily/streak";
import type { DailyPlanPreview } from "@/lib/home/constants";
import type { ConceptLesson } from "@/hooks/useDailyPlan";
interface HomeTodaySectionProps {
  streak?: DailyStreakResult;
  dailyPlan?: DailyPlanPreview | null;
  conceptLesson?: ConceptLesson | null;
}

export default function HomeTodaySection({
  streak,
  dailyPlan,
  conceptLesson = null,
}: HomeTodaySectionProps) {
  return (
    <section className="mt-10">
      <HomeSectionHeader
        number="01"
        title="What to do today"
        subtitle="one session, the right next step"
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.7fr_1fr]">
        <HomeDailyCard streak={streak} preview={dailyPlan} conceptLesson={conceptLesson} />
        <div className="flex flex-col gap-4">
          <HomeQuickActionCard
            href="/practice/sounds"
            icon={<Zap size={18} />}
            title="Quick practice"
            description="5 minutes on demand — no daily goal required."
          />
          <HomeAiPracticeCard />
        </div>
      </div>
    </section>
  );
}

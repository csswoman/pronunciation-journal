import { Zap } from "lucide-react";
import HomeSectionHeader from "@/components/home/HomeSectionHeader";
import HomeDailyCard from "@/components/home/HomeDailyCard";
import HomeWordOfDayCard from "@/components/home/HomeWordOfDayCard";
import HomeQuickActionCard from "@/components/home/HomeQuickActionCard";
import HomeStreakCard from "@/components/home/HomeStreakCard";
import type { DailyStreakResult } from "@/lib/daily/streak";
import type { ConceptLesson } from "@/hooks/useDailyPlan";

interface HomeTodaySectionProps {
  streak?: DailyStreakResult;
  conceptLesson?: ConceptLesson | null;
}

export default function HomeTodaySection({
  streak,
  conceptLesson = null,
}: HomeTodaySectionProps) {
  return (
    <section className="mt-8">
      <HomeSectionHeader
        number="01"
        title="What to do today"
        subtitle="one session, the right next step"
        size="lg"
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.7fr_1fr]">
        <HomeDailyCard conceptLesson={conceptLesson} />
        <div className="flex flex-col gap-4">
          <HomeWordOfDayCard />
          <HomeQuickActionCard
            href="/practice/sounds"
            icon={<Zap size={18} />}
            title="Quick practice"
            description="5 min on demand — no daily plan needed."
          />
          <HomeStreakCard streak={streak} />
        </div>
      </div>
    </section>
  );
}

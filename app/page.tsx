import SectionHeader from "@/components/layout/SectionHeader";
import HomeHeader from "@/components/home/HomeHeader";
import PageLayout from "@/components/layout/PageLayout";
import HomeStreakCard from "@/components/home/HomeStreakCard";
import HomeAchievementsCard from "@/components/home/HomeAchievementsCard";
import HomeProgressCard from "@/components/home/HomeProgressCard";
import HomePracticeCard from "@/components/home/HomePracticeCard";
import HomeCoursesSection from "@/components/home/HomeCoursesSection";

// Placeholder streak data — replace with real Supabase/Dexie data when available
const STREAK = 7;
const ACTIVE_DAYS = [true, true, true, true, true, true, false];

export default function HomePage() {
  return (
    <PageLayout hero={<HomeHeader />}>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        <div className="flex flex-col gap-6">
          <section>
            <SectionHeader title="Your Courses" viewAllHref="/courses" />
            <HomeCoursesSection />
          </section>
          <HomePracticeCard />
        </div>
        <div className="flex flex-col gap-4">
          <HomeStreakCard streak={STREAK} activeDays={ACTIVE_DAYS} />
          <HomeAchievementsCard />
          <HomeProgressCard lessonsThisWeek={8} weeklyChange={2} />
        </div>
      </div>
    </PageLayout>
  );
}

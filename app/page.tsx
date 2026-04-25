import SectionHeader from "@/components/layout/SectionHeader";
import HomeHeader from "@/components/home/HomeHeader";
import PageLayout from "@/components/layout/PageLayout";
import HomeStreakCard from "@/components/home/HomeStreakCard";
import HomeAchievementsCard from "@/components/home/HomeAchievementsCard";
import HomeProgressCard from "@/components/home/HomeProgressCard";
import HomePracticeCard from "@/components/home/HomePracticeCard";
import HomeCoursesSection from "@/components/home/HomeCoursesSection";
import { getWeeklyProgress, getStreakData, getAchievements, type Achievement } from "@/lib/home-stats";
import { getSupabaseServerUserId } from "@/lib/supabase/session";

export default async function HomePage() {
  let userId: string | null = null;
  let weeklyProgress = { lessonsThisWeek: 0, weeklyChange: 0, barData: [0, 0, 0, 0, 0, 0, 0] };
  let streakData = { currentStreak: 0, activeDays: [false, false, false, false, false, false, false] };
  let achievements: Achievement[] = [];

  userId = await getSupabaseServerUserId();
  if (userId) {
    try {
      [weeklyProgress, streakData, achievements] = await Promise.all([
        getWeeklyProgress(userId),
        getStreakData(userId),
        getAchievements(userId),
      ]);
    } catch (error) {
      console.error("Error loading home stats:", error);
    }
  }

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
          <HomeStreakCard streak={streakData.currentStreak} activeDays={streakData.activeDays} />
          <HomeAchievementsCard achievements={achievements} />
          <HomeProgressCard lessonsThisWeek={weeklyProgress.lessonsThisWeek} weeklyChange={weeklyProgress.weeklyChange} barData={weeklyProgress.barData} />
        </div>
      </div>
    </PageLayout>
  );
}

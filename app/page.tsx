import SectionHeader from "@/components/layout/SectionHeader";
import HomeHeader from "@/components/home/HomeHeader";
import PageLayout from "@/components/layout/PageLayout";
import HomeTodo from "@/components/home/HomeTodo";
import HomeAchievementsCard from "@/components/home/HomeAchievementsCard";
import HomeShadowingDrill from "@/components/home/HomeShadowingDrill";
import HomePracticeCard from "@/components/home/HomePracticeCard";
import HomeCoursesSection from "@/components/home/HomeCoursesSection";
import HomeWeakPhoneme from "@/components/home/HomeWeakPhoneme";
import HomeTheoryOfDay from "@/components/home/HomeTheoryOfDay";
import HomeWordsToReview from "@/components/home/HomeWordsToReview";
import HomeWordOfDay from "@/components/home/HomeWordOfDay";
import { getAchievements, type Achievement } from "@/lib/home-stats";
import { getSupabaseServerUserId } from "@/lib/supabase/session";

export default async function HomePage() {
  let userId: string | null = null;
  let achievements: Achievement[] = [];

  userId = await getSupabaseServerUserId();
  if (userId) {
    try {
      achievements = await getAchievements(userId);
    } catch (error) {
      console.error("Error loading home stats:", error);
    }
  }

  return (
    <PageLayout>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
        {/* Main column */}
        <div className="flex flex-col gap-6 min-w-0">
          <HomeHeader />
          <HomeTodo />
          <HomeWordsToReview />

          <section className="flex flex-col gap-3">
            <SectionHeader title="Your Courses" viewAllHref="/courses" />
            <HomeCoursesSection />
          </section>

          <HomePracticeCard />
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          <HomeWordOfDay />
          <HomeWeakPhoneme />
          <HomeTheoryOfDay />
          <HomeShadowingDrill />
          <HomeAchievementsCard achievements={achievements} />
        </div>
      </div>
    </PageLayout>
  );
}

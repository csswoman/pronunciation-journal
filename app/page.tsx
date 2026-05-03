import SectionHeader from "@/components/layout/SectionHeader";
import HomeHeader from "@/components/home/HomeHeader";
import PageLayout from "@/components/layout/PageLayout";
import HomeTodo from "@/components/home/HomeTodo";
import HomePracticeCard from "@/components/home/HomePracticeCard";
import HomeCoursesSection from "@/components/home/HomeCoursesSection";
import HomeWeakPhoneme from "@/components/home/HomeWeakPhoneme";
import HomeWordsToReview from "@/components/home/HomeWordsToReview";
import HomeAudioOfDay from "@/components/home/HomeAudioOfDay";
import HomeDrillCarousel from "@/components/home/HomeDrillCarousel";
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
    <PageLayout hero={<HomeHeader />}>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start">

        <div className="flex flex-col gap-8 min-w-0">

          <section>
            <SectionHeader title="Today's Focus" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <HomeWeakPhoneme />
              <HomeWordsToReview />
            </div>
          </section>

          <HomePracticeCard />

          <section>
            <SectionHeader title="Your Courses" viewAllHref="/courses" />
            <HomeCoursesSection />
          </section>

        </div>

        <div className="flex flex-col gap-4">
          <HomeTodo />
          <HomeDrillCarousel />
        </div>

      </div>
    </PageLayout>
  );
}

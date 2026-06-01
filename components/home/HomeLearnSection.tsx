import HomeSectionHeader from "@/components/home/HomeSectionHeader";
import HomeContinueCourseBar from "@/components/home/HomeContinueCourseBar";
import HomeDiscoveryCard from "@/components/home/HomeDiscoveryCard";
import HomeMiniLessonCard from "@/components/home/HomeMiniLessonCard";
import HomeWordOfDayCard from "@/components/home/HomeWordOfDayCard";
import type { MiniLesson } from "@/lib/content/schemas";

interface HomeLearnSectionProps {
  lesson: MiniLesson | null;
}

export default function HomeLearnSection({ lesson }: HomeLearnSectionProps) {
  return (
    <section className="mt-10">
      <HomeSectionHeader
        number="03"
        title="Learn something new"
        subtitle="advance your course and explore"
      />

      <HomeContinueCourseBar />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {lesson ? (
          <HomeMiniLessonCard lesson={lesson} />
        ) : (
          <HomeDiscoveryCard
            href="/courses/mini-lessons"
            badge="Mini lesson"
            title="Daily grammar bite"
            description="Short lessons on patterns you use every day."
            footer="Browse lessons →"
          />
        )}

        <HomeDiscoveryCard
          href="/words?tab=decks"
          badge="Concept"
          title="Irregular verbs"
          description="Study deck: base · past · participle, no flipping."
          footer="Open deck →"
        />

        <HomeWordOfDayCard />
      </div>
    </section>
  );
}

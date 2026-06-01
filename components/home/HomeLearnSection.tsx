import HomeSectionHeader from "@/components/home/HomeSectionHeader";
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
        subtitle="short lessons and vocabulary to explore"
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {lesson ? (
          <HomeMiniLessonCard lesson={lesson} />
        ) : (
          <HomeDiscoveryCard
            href="/mini-lessons"
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

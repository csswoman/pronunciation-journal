import HomeSectionHeader from "@/components/home/HomeSectionHeader";
import HomeDiscoveryCard from "@/components/home/HomeDiscoveryCard";
import HomeMiniLessonCard from "@/components/home/HomeMiniLessonCard";
import type { MiniLesson, LanguageConcept } from "@/lib/content/schemas";

interface HomeLearnSectionProps {
  lesson: MiniLesson | null;
  concept: LanguageConcept | null;
}

export default function HomeLearnSection({ lesson, concept }: HomeLearnSectionProps) {
  return (
    <section className="mt-12">
      <HomeSectionHeader
        number="03"
        title="Learn something new"
        subtitle="short lessons and vocabulary to explore"
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

        {concept ? (
          <HomeDiscoveryCard
            href={concept.href}
            badge={concept.badge}
            title={concept.title}
            description={concept.description}
            footer={concept.footer}
          />
        ) : (
          <HomeDiscoveryCard
            href="/words?tab=decks"
            badge="Concept"
            title="Irregular verbs"
            description="Study deck: base · past · participle, no flipping."
            footer="Open deck →"
          />
        )}
      </div>
    </section>
  );
}

import { notFound } from "next/navigation";
import Link from "next/link";
import PageLayout from "@/components/layout/PageLayout";
import PageHeader from "@/components/layout/PageHeader";
import {
  getLessonBySlug,
  getMiniLessonBySlug,
  getAllLessonSlugs,
  getAllMiniLessons,
} from "@/lib/content/lessons";
import {
  MINI_LESSON_CATEGORY_LABELS,
  MINI_LESSON_LEVEL_LABELS,
} from "@/lib/content/mini-lesson-labels";
import MiniLessonQuiz from "@/components/mini-lessons/MiniLessonQuiz";
import MiniLessonComplete from "@/components/mini-lessons/MiniLessonComplete";
import MiniLessonArticleRail from "@/components/mini-lessons/MiniLessonArticleRail";
import ExerciseBlock from "@/components/mini-lessons/ExerciseBlock";
import { TrackingSaveButton } from "@/components/tracking/TrackingSaveButton";
import { resolveMiniLessonDeckLink } from "@/lib/learning-loop/mini-lesson-deck-link";

interface MiniLessonPageProps {
  params: Promise<{ slug: string }>;
}

export default async function MiniLessonDetailPage({ params }: MiniLessonPageProps) {
  const { slug } = await params;

  const [lesson, content, allLessons] = await Promise.all([
    getMiniLessonBySlug(slug),
    getLessonBySlug(slug),
    getAllMiniLessons(),
  ]);

  if (!lesson || !content) {
    notFound();
  }

  const currentIndex = allLessons.findIndex((l) => l.slug === slug);
  const previousLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : undefined;
  const nextLesson = currentIndex >= 0 ? allLessons[currentIndex + 1] : undefined;
  const deckLink = resolveMiniLessonDeckLink(slug);

  const tocItems = [
    ...content.sections.map((section, idx) => ({
      href: `#lesson-section-${idx + 1}`,
      label: section.heading,
    })),
    ...(content.examples.length > 0
      ? [{ href: "#lesson-examples", label: "Examples" }]
      : []),
    ...(content.exercises.length > 0
      ? [{ href: "#lesson-exercises", label: "Exercises" }]
      : []),
    ...(content.quiz.length > 0 ? [{ href: "#lesson-quiz", label: "Quiz" }] : []),
  ];

  return (
    <article className="mini-lessons mini-lessons--article">
      <PageLayout
        archetype="dashboard"
        banner={
          <header className="mini-lessons__article-intro">
            <Link href="/mini-lessons" className="mini-lessons__back">
              ← Mini lecciones
            </Link>

            <PageHeader
              variant="compact"
              kicker={MINI_LESSON_CATEGORY_LABELS[lesson.category]}
              title={lesson.title}
              subtitle={lesson.body}
            />

            <div className="mini-lessons__article-badges">
              <span className="mini-lessons__pill mini-lessons__pill--level">
                {MINI_LESSON_LEVEL_LABELS[lesson.level]}
              </span>
              <span className="mini-lessons__pill mini-lessons__pill--category">
                {MINI_LESSON_CATEGORY_LABELS[lesson.category]}
              </span>
              <span className="mini-lessons__pill mini-lessons__pill--duration">
                {lesson.duration} min
              </span>
            </div>
          </header>
        }
        rail={
          <MiniLessonArticleRail
            tocItems={tocItems}
            deckLink={deckLink}
            nextLesson={nextLesson}
            previousLesson={previousLesson}
          />
        }
        railLabel="Resumen de la lección"
      >
        <main className="mini-lessons__article-main">
          {content.sections.map((section, idx) => (
            <section
              key={idx}
              id={`lesson-section-${idx + 1}`}
              className="mini-lessons__section"
            >
              <h2 className="mini-lessons__section-title">{section.heading}</h2>
              <p className="mini-lessons__section-body">{section.body}</p>
            </section>
          ))}

          {content.examples.length > 0 && (
            <section
              id="lesson-examples"
              className="mini-lessons__section mini-lessons__section--examples"
            >
              <h2 className="mini-lessons__section-title">Examples</h2>
              <div className="mini-lessons__examples">
                {content.examples.map((example, idx) => (
                  <div key={idx} className="mini-lessons__example">
                    <p className="mini-lessons__example-en">{example.english}</p>
                    {example.ipa && (
                      <p className="mini-lessons__example-ipa" lang="en-fonipa">
                        <span className="mini-lessons__ipa-slash" aria-hidden>
                          /
                        </span>
                        {example.ipa}
                        <span className="mini-lessons__ipa-slash" aria-hidden>
                          /
                        </span>
                      </p>
                    )}
                    {example.note && (
                      <p className="mini-lessons__example-note">{example.note}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {lesson.tip && (
            <aside className="mini-lessons__tip">
              <svg
                className="mini-lessons__tip-icon"
                aria-hidden
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                <path
                  d="M8 5v4M8 11v.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              <div>
                <span className="mini-lessons__tip-label">Tip</span>
                <p className="mini-lessons__tip-body">{lesson.tip}</p>
              </div>
            </aside>
          )}

          {content.exercises.length > 0 && (
            <section id="lesson-exercises" className="mini-lessons__section">
              <h2 className="mini-lessons__section-title">Exercises</h2>
              {content.exercises.map((exercise, idx) => (
                <ExerciseBlock
                  key={idx}
                  instruction={exercise.instruction}
                  items={exercise.items}
                />
              ))}
            </section>
          )}

          {content.quiz.length > 0 && (
            <section id="lesson-quiz" className="mini-lessons__section">
              <h2 className="mini-lessons__section-title">Quiz</h2>
              <MiniLessonQuiz questions={content.quiz} slug={slug} />
            </section>
          )}
        </main>

        <footer className="mini-lessons__footer">
          <Link href="/mini-lessons" className="mini-lessons__btn mini-lessons__btn--ghost">
            ← Todas las lecciones
          </Link>
          {content.quiz.length === 0 && <MiniLessonComplete slug={slug} />}
          <TrackingSaveButton kind="lesson" reference={slug} title={lesson.title} />
          {deckLink ? (
            <Link href={deckLink.href} className="mini-lessons__btn">
              {deckLink.viaRoute ? "Estudiar en la Ruta" : "Abrir mazo"} →
            </Link>
          ) : (
            nextLesson && (
              <Link href={`/mini-lessons/${nextLesson.slug}`} className="mini-lessons__btn">
                Siguiente: {nextLesson.title} →
              </Link>
            )
          )}
        </footer>
      </PageLayout>
    </article>
  );
}

export async function generateStaticParams() {
  const slugs = await getAllLessonSlugs();
  return slugs.map((slug) => ({ slug }));
}

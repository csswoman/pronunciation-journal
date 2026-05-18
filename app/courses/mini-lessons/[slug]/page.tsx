import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getLessonBySlug,
  getMiniLessonBySlug,
  getAllLessonSlugs,
} from "@/lib/content/lessons";

interface MiniLessonPageProps {
  params: Promise<{ slug: string }>;
}

export default async function MiniLessonPage({ params }: MiniLessonPageProps) {
  const { slug } = await params;

  const [lesson, content] = await Promise.all([
    getMiniLessonBySlug(slug),
    getLessonBySlug(slug),
  ]);

  if (!lesson || !content) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <Link href="/courses" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-6 inline-block">
        ← Back to courses
      </Link>

      <div className="mb-8">
        <div className="mb-3 inline-block">
          <span className="text-xs font-medium text-[var(--primary)] bg-[var(--btn-regular-bg)] px-2 py-1 rounded">
            {lesson.level.toUpperCase()} · {lesson.category} · {lesson.duration} min
          </span>
        </div>
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">{lesson.title}</h1>
        <p className="text-lg text-[var(--text-secondary)]">{lesson.body}</p>
      </div>

      {/* Content Sections */}
      <div className="space-y-8 mb-12">
        {content.sections.map((section, idx) => (
          <section key={idx}>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">{section.heading}</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">{section.body}</p>
          </section>
        ))}
      </div>

      {/* Examples */}
      {content.examples.length > 0 && (
        <div className="mb-12 border-t border-[var(--border-subtle)] pt-8">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Examples</h2>
          <div className="space-y-3">
            {content.examples.map((example, idx) => (
              <div key={idx} className="bg-[var(--btn-regular-bg)] rounded-lg p-4">
                <p className="text-sm font-mono text-[var(--primary)]">{example.english}</p>
                {example.ipa && (
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">/{example.ipa}</p>
                )}
                {example.note && (
                  <p className="text-xs text-[var(--text-secondary)] mt-2 italic">{example.note}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tip */}
      {lesson.tip && (
        <div className="mb-12 bg-[var(--btn-regular-bg)] border-l-4 border-[var(--primary)] p-4 rounded">
          <p className="text-sm text-[var(--text-primary)]">
            <strong>💡 Tip:</strong> {lesson.tip}
          </p>
        </div>
      )}

      {/* Exercises */}
      {content.exercises.length > 0 && (
        <div className="mb-12 border-t border-[var(--border-subtle)] pt-8">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Exercises</h2>
          <div className="space-y-6">
            {content.exercises.map((exercise, idx) => (
              <div key={idx} className="bg-[var(--btn-regular-bg)] rounded-lg p-4">
                <p className="text-sm font-medium text-[var(--text-primary)] mb-3">{exercise.instruction}</p>
                <ul className="space-y-2">
                  {exercise.items.map((item, itemIdx) => (
                    <li key={itemIdx} className="text-sm text-[var(--text-secondary)]">
                      {itemIdx + 1}. {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quiz */}
      {content.quiz.length > 0 && (
        <div className="mb-12 border-t border-[var(--border-subtle)] pt-8">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Quiz</h2>
          <div className="space-y-6">
            {content.quiz.map((q, idx) => (
              <div key={idx} className="bg-[var(--btn-regular-bg)] rounded-lg p-4">
                <p className="text-sm font-medium text-[var(--text-primary)] mb-3">
                  {idx + 1}. {q.question}
                </p>
                <ul className="space-y-2 mb-3">
                  {q.options.map((option, optIdx) => (
                    <li key={optIdx} className="text-sm text-[var(--text-secondary)]">
                      <span className="inline-block w-5 h-5 rounded border border-[var(--border-subtle)] mr-2 text-center text-xs leading-5">
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      {option}
                    </li>
                  ))}
                </ul>
                <details className="cursor-pointer">
                  <summary className="text-xs font-medium text-[var(--primary)] hover:text-[var(--primary)]/80">
                    Show answer
                  </summary>
                  <div className="mt-2 pt-2 border-t border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
                    <p className="font-medium mb-1">
                      Answer: <strong>{String.fromCharCode(65 + q.correct)}</strong>
                    </p>
                    <p>{q.explanation}</p>
                  </div>
                </details>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="border-t border-[var(--border-subtle)] pt-8 mt-12">
        <Link
          href="/courses"
          className="inline-block px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Back to courses
        </Link>
      </div>
    </div>
  );
}

export async function generateStaticParams() {
  const slugs = await getAllLessonSlugs();
  return slugs.map((slug) => ({ slug }));
}

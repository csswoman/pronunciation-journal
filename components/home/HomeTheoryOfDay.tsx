import Link from "next/link";
import { BookOpen, Clock, Sparkles } from "lucide-react";
import { CardBadge } from "@/components/ui/CardBadge";
import { getTodaysLesson } from "@/lib/mini-lessons";

interface HomeTheoryOfDayProps {
  lesson?: ReturnType<typeof getTodaysLesson>;
}

export default function HomeTheoryOfDay({ lesson }: HomeTheoryOfDayProps) {
  const todaysLesson = lesson ?? getTodaysLesson();

  return (
    <div className="rounded-xl border border-border-subtle bg-surface-raised p-4 flex flex-col gap-3">

      {/* Badge */}
      <CardBadge color="primary" icon={<BookOpen size={12} />}>
        Mini Lesson
      </CardBadge>

      {/* Meta */}
      <div className="flex items-center gap-1.5 text-xs text-fg-subtle mb-2">
        <Clock size={12} className="shrink-0" />
        <span>{todaysLesson.duration} min · {todaysLesson.subtitle}</span>
      </div>

      {/* Title */}
      <div className="-mt-3">
        <p className="text-2xl font-bold text-fg leading-tight">{todaysLesson.title}</p>
      </div>

      {/* Body */}
      <p className="text-sm leading-relaxed text-fg-muted">{todaysLesson.body}</p>

      {/* Examples */}
      {todaysLesson.examples.length > 0 && (
        <div className="rounded-xl border border-border-subtle border-l-2 border-l-primary bg-[var(--accent-dim)] px-4 py-3 flex flex-col gap-2">
          <p className="flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase text-primary">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z"></path></svg>
            Examples
          </p>
          {todaysLesson.examples.map(({ word, ipa, translation }, i) => (
            <div key={i} className="flex flex-col gap-0.5">
              {i > 0 && <hr className="border-border-subtle mb-1" />}
              <p className="text-sm italic font-medium text-primary leading-snug">{word}</p>
              {(ipa || translation) && (
                <p className="text-xs text-fg-subtle font-mono">
                  {ipa}{ipa && translation ? " · " : ""}{translation}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tip */}
      {todaysLesson.tip && (
        <p className="text-xs italic text-fg-subtle px-3 py-2 border-l-2 border-primary">
          💡 {todaysLesson.tip}
        </p>
      )}

      {/* CTA */}
      <Link
        href={`/courses/mini-lessons/${todaysLesson.slug}`}
        className="flex items-center justify-between bg-fg text-surface-raised text-sm font-medium rounded-xl px-5 py-3.5 hover:opacity-90 transition-opacity"
      >
        <span>Read full lesson</span>
        <span>→</span>
      </Link>
    </div>
  );
}

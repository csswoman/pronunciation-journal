import Link from "next/link";
import Card from "@/components/layout/Card";

interface HomeTheoryOfDayProps {
  slug?: string;
  duration?: number;
  title?: string;
  description?: string;
  examples?: { word: string; ipa: string }[];
}

export default function HomeTheoryOfDay({
  slug = "#",
  duration = 5,
  title = "When to use the schwa /ə/",
  description = "The most common vowel sound in English. It appears in unstressed syllables — and mastering it is the single biggest unlock for sounding natural.",
  examples = [
    { word: "banana", ipa: "/bəˈnɑː.nə/" },
    { word: "about", ipa: "/əˈbaʊt/" },
  ],
}: HomeTheoryOfDayProps) {
  return (
    <Card variant="compact" className="gap-4">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold tracking-widest text-[var(--primary)] uppercase border border-[var(--primary)] rounded-full px-2 py-0.5">
          Mini Lesson · {duration} min
        </span>
      </div>

      <div>
        <p className="text-xs text-[var(--text-tertiary)] mb-1">Theory of the day</p>
        <p className="text-lg font-bold text-[var(--deep-text)] leading-snug">{title}</p>
      </div>

      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{description}</p>

      <div className="rounded-xl bg-[var(--btn-regular-bg)] px-4 py-3 flex flex-col gap-1.5">
        {examples.map(({ word, ipa }) => (
          <p key={word} className="text-sm font-mono text-[var(--primary)]">
            {word} · <span className="text-[var(--text-secondary)]">{ipa}</span>
          </p>
        ))}
      </div>

      <Link
        href={`/lessons/${slug}`}
        className="block text-center text-sm font-medium text-[var(--deep-text)] border border-[var(--line-divider)] rounded-xl py-2.5 hover:bg-[var(--btn-regular-bg)] transition-colors"
      >
        Read full lesson →
      </Link>
    </Card>
  );
}

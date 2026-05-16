import Link from "next/link";
import { CardBadge } from "@/components/ui/CardBadge";

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
    <div className="rounded-xl border border-border-subtle bg-surface-raised p-4 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <CardBadge color="primary">Mini Lesson · {duration} min</CardBadge>
      </div>

      <div>
        <p className="text-xs text-[var(--text-tertiary)] mb-1">Theory of the day</p>
        <p className="text-base font-medium text-[var(--text-primary)] leading-snug">{title}</p>
      </div>

      <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{description}</p>

      <div className="rounded-xl bg-[var(--btn-regular-bg)] px-4 py-3 flex flex-col gap-1.5">
        {examples.map(({ word, ipa }) => (
          <p key={word} className="text-sm font-mono text-[var(--primary)]">
            {word} · <span className="text-fg-muted">{ipa}</span>
          </p>
        ))}
      </div>

      <Link
        href="/courses"
        className="block text-center text-sm font-medium text-fg border border-[var(--line-divider)] rounded-xl py-2.5 hover:bg-[var(--btn-regular-bg)] transition-colors"
      >
        Read full lesson →
      </Link>
    </div>
  );
}

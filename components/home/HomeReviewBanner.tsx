import Link from "next/link";
import { ArrowRight } from "@/components/icons";

interface HomeReviewBannerProps {
  wordsDueCount?: number;
  soundsDueCount?: number;
}

function wordLabel(count: number): string {
  return `${count} ${count === 1 ? "palabra" : "palabras"}`;
}

function soundLabel(count: number): string {
  return `${count} ${count === 1 ? "sonido" : "sonidos"}`;
}

function primaryTarget(wordsDueCount: number, soundsDueCount: number): {
  href: string;
  label: string;
} {
  if (wordsDueCount >= soundsDueCount && wordsDueCount > 0) {
    return { href: "/practice/review", label: `Repasar ${wordLabel(wordsDueCount)}` };
  }
  if (soundsDueCount > 0) {
    return { href: "/practice/sounds", label: `Repasar ${soundLabel(soundsDueCount)}` };
  }
  return { href: "/practice/review", label: "Repasar ahora" };
}

/**
 * Consolidation of review actions. Embedded directly in the Daily Card to maintain hierarchy.
 */
export default function HomeReviewBanner({
  wordsDueCount = 0,
  soundsDueCount = 0,
}: HomeReviewBannerProps) {
  const total = wordsDueCount + soundsDueCount;
  if (total <= 0) return null;

  const { href, label } = primaryTarget(wordsDueCount, soundsDueCount);
  const secondary =
    wordsDueCount > 0 && soundsDueCount > 0
      ? wordsDueCount >= soundsDueCount
        ? {
            href: "/practice/sounds",
            label: `o ${soundLabel(soundsDueCount)} →`,
          }
        : {
            href: "/practice/review",
            label: `o ${wordLabel(wordsDueCount)} →`,
          }
      : null;

  return (
    <div className="flex flex-col gap-3 pb-4 mb-4 border-b border-border-subtle sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex flex-col gap-0.5">
        <p className="font-label font-semibold text-fg">Te toca repasar</p>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Link
          href={href}
          className="focus-ring inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-md bg-primary px-5 font-label text-on-primary transition-colors hover:bg-primary-hover"
        >
          {label}
          <ArrowRight size={16} aria-hidden />
        </Link>
        {secondary ? (
          <Link
            href={secondary.href}
            className="focus-ring inline-flex min-h-10 items-center font-body-sm text-fg-muted underline-offset-2 hover:text-fg hover:underline"
          >
            {secondary.label}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

import Link from "next/link";
import { ArrowRight } from "@/components/icons";

interface HomeReviewBannerProps {
  wordsDueCount?: number;
  soundsDueCount?: number;
}

function primaryTarget(wordsDueCount: number, soundsDueCount: number): {
  href: string;
  label: string;
} {
  if (wordsDueCount >= soundsDueCount && wordsDueCount > 0) {
    return { href: "/practice/review", label: "Repasar palabras" };
  }
  if (soundsDueCount > 0) {
    return { href: "/practice/sounds", label: "Repasar sonidos" };
  }
  return { href: "/practice/review", label: "Repasar ahora" };
}

/**
 * Full-width strip above the plan grid — never nested inside the daily card.
 * One primary CTA; optional secondary when both queues have due items.
 */
export default function HomeReviewBanner({
  wordsDueCount = 0,
  soundsDueCount = 0,
}: HomeReviewBannerProps) {
  const total = wordsDueCount + soundsDueCount;
  if (total <= 0) return null;

  const parts = [
    wordsDueCount > 0 &&
      `${wordsDueCount} ${wordsDueCount === 1 ? "palabra" : "palabras"}`,
    soundsDueCount > 0 &&
      `${soundsDueCount} ${soundsDueCount === 1 ? "sonido" : "sonidos"}`,
  ].filter(Boolean);

  const { href, label } = primaryTarget(wordsDueCount, soundsDueCount);
  const secondary =
    wordsDueCount > 0 && soundsDueCount > 0
      ? wordsDueCount >= soundsDueCount
        ? {
            href: "/practice/sounds",
            label: `También ${soundsDueCount} ${soundsDueCount === 1 ? "sonido" : "sonidos"}`,
          }
        : {
            href: "/practice/review",
            label: `También ${wordsDueCount} ${wordsDueCount === 1 ? "palabra" : "palabras"}`,
          }
      : null;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface-raised px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5">
      <div className="min-w-0 flex flex-col gap-0.5">
        <p className="font-label font-semibold text-fg">Pendiente de repasar</p>
        <p className="font-body-sm tabular-nums text-fg-muted">
          {total} {total === 1 ? "pendiente" : "pendientes"}
          {parts.length > 0 ? ` · ${parts.join(" · ")}` : ""}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Link
          href={href}
          className="focus-ring inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-md bg-primary px-4 font-label text-on-primary"
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

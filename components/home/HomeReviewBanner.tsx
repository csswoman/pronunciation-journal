import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface HomeReviewBannerProps {
  wordsDueCount?: number;
  soundsDueCount?: number;
}

export default function HomeReviewBanner({
  wordsDueCount = 0,
  soundsDueCount = 0,
}: HomeReviewBannerProps) {
  const total = wordsDueCount + soundsDueCount;
  if (total <= 0) return null;

  const parts = [
    wordsDueCount > 0 && `${wordsDueCount} word${wordsDueCount === 1 ? "" : "s"}`,
    soundsDueCount > 0 && `${soundsDueCount} sound${soundsDueCount === 1 ? "" : "s"}`,
  ].filter(Boolean);

  const href =
    wordsDueCount > 0
      ? "/practice/review"
      : soundsDueCount > 0
        ? "/practice/sounds"
        : "/practice/review";

  return (
    <Link
      href={href}
      className="home-card-lift focus-ring flex items-center gap-3 rounded-xl border border-border-subtle bg-surface-sunken px-4 py-3 transition-transform active:scale-[0.96]"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="font-kicker">Review</span>
        <p className="font-label tabular-nums font-semibold text-fg">
          {total} due
          {parts.length > 0 ? (
            <span className="font-caption font-normal text-fg-muted">
              {" "}
              · {parts.join(" · ")}
            </span>
          ) : null}
        </p>
      </div>
      <span className="font-label inline-flex shrink-0 items-center gap-1 font-semibold text-primary">
        Review now
        <ArrowRight size={14} aria-hidden />
      </span>
    </Link>
  );
}

import Link from "next/link";
import { ArrowRight } from "@/components/icons";

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
    wordsDueCount > 0 &&
      `${wordsDueCount} ${wordsDueCount === 1 ? "palabra" : "palabras"}`,
    soundsDueCount > 0 &&
      `${soundsDueCount} ${soundsDueCount === 1 ? "sonido" : "sonidos"}`,
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
      className="home-card-lift focus-ring flex items-center gap-4 rounded-xl border border-primary bg-primary-soft px-5 py-4 shadow-sm transition-transform active:scale-[0.96]"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="font-kicker text-fg-muted">Urgente</span>
        <span className="text-h4 text-fg">Pendiente de repasar</span>
        <p className="font-body-sm tabular-nums text-fg">
          {total} {total === 1 ? "pendiente" : "pendientes"}
          {parts.length > 0 ? (
            <span className="text-fg-muted">
              {" "}
              · {parts.join(" · ")}
            </span>
          ) : null}
        </p>
      </div>
      <span className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-md bg-primary px-4 font-label text-on-primary">
        Repasar ahora
        <ArrowRight size={16} aria-hidden />
      </span>
    </Link>
  );
}

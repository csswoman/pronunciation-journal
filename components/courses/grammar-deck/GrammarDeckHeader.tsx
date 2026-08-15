import Link from "next/link";
import { ArrowLeft } from "@/components/icons";
import type { GrammarDeckMeta } from "@/lib/courses/grammar-deck/types";

interface GrammarDeckHeaderProps {
  meta: GrammarDeckMeta;
  reviewedCount: number;
  totalCount: number;
  backHref?: string;
  backLabel?: string;
  subtitle?: string;
}

export default function GrammarDeckHeader({
  meta,
  reviewedCount,
  totalCount,
  backHref = "/courses",
  backLabel = "Ruta",
  subtitle,
}: GrammarDeckHeaderProps) {
  const pct = totalCount === 0 ? 0 : Math.round((reviewedCount / totalCount) * 100);

  return (
    <header className="grammar-deck__head">
      <Link href={backHref} className="grammar-deck__back">
        <ArrowLeft size={14} aria-hidden />
        {backLabel}
      </Link>
      <div className="grammar-deck__identity">
        <span className="grammar-deck__eyebrow">{subtitle ?? meta.eyebrow}</span>
        <h1 className="grammar-deck__title">
          {meta.title}
          {meta.titleEmphasis && <em> {meta.titleEmphasis}</em>}
        </h1>
      </div>
      <div className="grammar-deck__meta">
        <span className="grammar-deck__count">
          <b>{reviewedCount}</b> / {totalCount} repasadas
        </span>
        <div className="grammar-deck__prog" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <span className="grammar-deck__prog-fill" style={{ transform: `scaleX(${pct / 100})` }} />
        </div>
      </div>
    </header>
  );
}

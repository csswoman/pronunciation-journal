import Link from "next/link";
import { ArrowLeft, Target } from "lucide-react";
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
  backLabel = "Ruta de aprendizaje",
  subtitle,
}: GrammarDeckHeaderProps) {
  const pct = totalCount === 0 ? 0 : Math.round((reviewedCount / totalCount) * 100);

  return (
    <header className="grammar-deck__head">
      <Link href={backHref} className="grammar-deck__back">
        <ArrowLeft size={14} aria-hidden />
        {backLabel}
      </Link>
      <span className="grammar-deck__eyebrow">{subtitle ?? meta.eyebrow}</span>
      <h1 className="grammar-deck__title">
        {meta.title}
        {meta.titleEmphasis && <em> {meta.titleEmphasis}</em>}
      </h1>
      {meta.goal && (
        <p className="grammar-deck__goal">
          <Target size={13} strokeWidth={2.25} aria-hidden />
          <span>{meta.goal}</span>
        </p>
      )}
      <div className="grammar-deck__meta">
        <div className="grammar-deck__prog" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <span className="grammar-deck__prog-fill" style={{ transform: `scaleX(${pct / 100})` }} />
        </div>
        <span className="grammar-deck__count">
          <b>{reviewedCount}</b> / {totalCount} repasadas
        </span>
      </div>
    </header>
  );
}

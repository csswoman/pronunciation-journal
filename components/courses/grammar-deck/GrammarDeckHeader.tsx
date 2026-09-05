import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft } from "@/components/icons";
import { TrackingSaveButton } from "@/components/tracking/TrackingSaveButton";
import { LessonDownloadButton } from "@/components/courses/LessonDownloadButton";
import { db } from "@/lib/db";
import type { GrammarDeckMeta } from "@/lib/courses/grammar-deck/types";
import { studyOrPracticeDeckHref } from "@/lib/courses/curriculumIndex";

interface GrammarDeckHeaderProps {
  meta: GrammarDeckMeta;
  reviewedCount: number;
  totalCount: number;
  backHref?: string;
  backLabel?: string;
  subtitle?: string;
  lessonSlug?: string;
  levelId?: string;
  lessonNumber?: number;
}

export default function GrammarDeckHeader({
  meta,
  reviewedCount,
  totalCount,
  backHref = "/courses",
  backLabel = "Ruta",
  subtitle,
  lessonSlug,
  levelId,
  lessonNumber,
}: GrammarDeckHeaderProps) {
  const pct = totalCount === 0 ? 0 : Math.round((reviewedCount / totalCount) * 100);
  const fullTitle = [meta.title, meta.titleEmphasis].filter(Boolean).join(" ");
  const deckHref = lessonSlug ? studyOrPracticeDeckHref(lessonSlug) : undefined;
  const downloadId = levelId && lessonNumber ? `${levelId}:${lessonNumber}` : null;
  const downloadedRecord = useLiveQuery(
    async () => {
      if (!downloadId) return undefined;
      return db.downloadedLessons.get(downloadId);
    },
    [downloadId],
    undefined,
  );

  return (
    <header className="grammar-deck__head">
      <Link href={backHref} className="grammar-deck__back">
        <ArrowLeft size={14} aria-hidden />
        {backLabel}
      </Link>
      <div className="grammar-deck__identity">
        <span className="grammar-deck__eyebrow">{subtitle ?? meta.eyebrow}</span>
        <div className="flex items-center gap-2">
          <h1 className="grammar-deck__title">
            {meta.title}
            {meta.titleEmphasis && <em> {meta.titleEmphasis}</em>}
          </h1>
          {lessonSlug && (
            <>
              {levelId && lessonNumber && (
                <LessonDownloadButton
                  trackId={levelId}
                  lessonNumber={lessonNumber}
                  slug={lessonSlug}
                  title={fullTitle}
                  variant="badge"
                  isDownloaded={Boolean(downloadedRecord)}
                />
              )}
              <TrackingSaveButton
                kind="lesson"
                reference={lessonSlug}
                title={fullTitle}
                payload={deckHref ? { href: deckHref } : undefined}
                variant="heart"
              />
            </>
          )}
        </div>
      </div>
      <div className="grammar-deck__meta">
        <div className="grammar-deck__prog" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <span className="grammar-deck__prog-fill" style={{ transform: `scaleX(${pct / 100})` }} />
        </div>
        <span className="grammar-deck__count">
          <b>{String(reviewedCount).padStart(2, "0")}</b> / {String(totalCount).padStart(2, "0")}
        </span>
      </div>
    </header>
  );
}

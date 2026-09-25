// Planned structure:
// <GrammarDeckHeader>
//   <Link backHref>
//   <HeaderIdentity (icon, eyebrow, title)>
//   <HeaderProgressSegments (count, multi-segment bars)>
//   <HeaderActions (download, save)>
// </GrammarDeckHeader>

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft, Code2 } from "@/components/icons";
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

  const totalSegments = Math.max(totalCount, 1);
  const segments = Array.from({ length: totalSegments }, (_, i) => i < reviewedCount);

  return (
    <header className="grammar-deck__head">
      <div className="grammar-deck__head-bar">
        <Link href={backHref} className="grammar-deck__back-round" aria-label={backLabel} title={backLabel}>
          <ArrowLeft size={16} aria-hidden />
        </Link>

        <div className="grammar-deck__head-center">
          <div className="grammar-deck__icon-squircle">
            <Code2 size={16} aria-hidden />
          </div>

          <div className="grammar-deck__identity">
            <span className="grammar-deck__eyebrow">{subtitle ?? meta.eyebrow}</span>
            <h1 className="grammar-deck__title">
              {meta.title}
              {meta.titleEmphasis && <em> {meta.titleEmphasis}</em>}
            </h1>
          </div>
        </div>

        <div className="grammar-deck__head-prog-wrap">
          <span className="grammar-deck__count-label">
            {reviewedCount} de {totalCount}
          </span>
          <div className="grammar-deck__segmented-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            {segments.map((isFilled, idx) => (
              <span
                key={idx}
                className={`grammar-deck__segment ${isFilled ? "grammar-deck__segment--filled" : ""}`}
              />
            ))}
          </div>
        </div>

        <div className="grammar-deck__head-actions">
          {lessonSlug && levelId && lessonNumber && (
            <LessonDownloadButton
              trackId={levelId}
              lessonNumber={lessonNumber}
              slug={lessonSlug}
              title={fullTitle}
              variant="badge"
              isDownloaded={Boolean(downloadedRecord)}
            />
          )}
          {lessonSlug && (
            <TrackingSaveButton
              kind="lesson"
              reference={lessonSlug}
              title={fullTitle}
              payload={deckHref ? { href: deckHref } : undefined}
              variant="heart"
            />
          )}
        </div>
      </div>
    </header>
  );
}


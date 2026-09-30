'use client';

// Planned structure:
// <ImmersionVideoThumbnail>
//   <ThumbnailWrapper>
//     <YouTubeCoverImage />
//     <ImageBackdropOverlay />
//     <TopBadges level={level} isWatched={isWatched} />
//     {showPlayButton && <CenteredPlayButton />}
//     <DurationBadge durationLabel={durationLabel} />
//   </ThumbnailWrapper>
// </ImmersionVideoThumbnail>

import Image from 'next/image';
import { Play } from '@/components/icons';
import { cn } from '@/lib/cn';
import type { ImmersionLevel } from '@/lib/immersion/types';

interface ImmersionVideoThumbnailProps {
  youtubeVideoId: string;
  title: string;
  level?: ImmersionLevel;
  durationMinutes: number;
  remainingMinutes?: number;
  isWatched?: boolean;
  showPlayButton?: boolean;
  className?: string;
}

export function ImmersionVideoThumbnail({
  youtubeVideoId,
  title,
  level,
  durationMinutes,
  remainingMinutes,
  isWatched = false,
  showPlayButton = false,
  className,
}: ImmersionVideoThumbnailProps) {
  const durationLabel =
    remainingMinutes != null ? `quedan ${remainingMinutes} min` : `${durationMinutes} min`;
  const thumbnailUrl = youtubeVideoId
    ? `https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg`
    : '';

  return (
    <div
      className={cn(
        'relative aspect-video w-full overflow-hidden rounded-xl bg-surface-sunken select-none border border-border-default/60',
        className,
      )}
    >
      {thumbnailUrl ? (
        <Image
          src={thumbnailUrl}
          alt={title}
          fill
          unoptimized
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-surface-sunken" />
      )}

      {/* Overlay sutil para legibilidad de badges */}
      <div className="absolute inset-0 bg-surface-tooltip/15 transition-opacity group-hover:bg-surface-tooltip/10" />

      {/* Badges superiores a la izquierda (nivel y vista) */}
      <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 flex-wrap">
        {level && (
          <span className="inline-flex items-center justify-center rounded-full bg-ink px-2.5 py-0.5 text-tiny font-bold tracking-wide text-paper shadow-xs">
            {level}
          </span>
        )}
        {isWatched && (
          <span className="inline-flex items-center justify-center rounded-full bg-mint px-2 py-0.5 text-tiny font-bold tracking-wide text-ink border border-ink/15 shadow-xs">
            VISTA
          </span>
        )}
      </div>

      {/* Botón play central (típico de video principal) */}
      {showPlayButton && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="flex size-11 items-center justify-center rounded-full bg-ink text-paper shadow-md transition-transform duration-150 group-hover:scale-110">
            <Play className="ml-0.5 size-5 fill-current" />
          </div>
        </div>
      )}

      {/* Badge de duración en la esquina inferior derecha */}
      <div className="absolute bottom-2.5 right-2.5 z-10">
        <span className="inline-flex items-center justify-center rounded-full bg-ink/90 px-2.5 py-0.5 text-tiny font-mono font-medium text-paper shadow-xs backdrop-blur-xs">
          {durationLabel}
        </span>
      </div>
    </div>
  );
}

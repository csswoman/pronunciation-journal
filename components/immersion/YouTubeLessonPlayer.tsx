'use client';

// Planned structure:
// <YouTubeLessonPlayer>
//   <VideoContainer> (16:9 rounded-2xl iframe container — YouTube iframe intact)
//   <AttributionCard> (Teacher avatar, channel attribution, official channel link, and watch status button)
// </YouTubeLessonPlayer>

import { forwardRef, useImperativeHandle, useRef } from 'react';
import { ArrowUpRight, Check } from '@/components/icons';
import type { ImmersionLesson } from '@/lib/immersion/types';

export interface YouTubePlayerHandle {
  seekTo: (seconds: number) => void;
}

interface YouTubeLessonPlayerProps {
  lesson: ImmersionLesson;
  isWatched?: boolean;
  onMarkWatched: () => void;
}

export const YouTubeLessonPlayer = forwardRef<YouTubePlayerHandle, YouTubeLessonPlayerProps>(
  function YouTubeLessonPlayer({ lesson, isWatched = false, onMarkWatched }, ref) {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useImperativeHandle(ref, () => ({
      seekTo: (seconds: number) => {
        if (!iframeRef.current?.contentWindow) return;
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({
            event: 'command',
            func: 'seekTo',
            args: [seconds, true],
          }),
          '*',
        );
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({
            event: 'command',
            func: 'playVideo',
            args: [],
          }),
          '*',
        );
      },
    }));

    const embedUrl = `https://www.youtube-nocookie.com/embed/${lesson.youtubeVideoId}?enablejsapi=1&rel=0&modestbranding=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`;

    return (
      <div className="flex flex-col gap-4">
        {/* 16:9 Aspect Ratio Container with rounded-2xl */}
        <div className="relative w-full overflow-hidden rounded-2xl border border-border-default bg-surface-sunken shadow-xs aspect-video">
          <iframe
            ref={iframeRef}
            src={embedUrl}
            title={lesson.title}
            className="absolute inset-0 size-full rounded-2xl"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>

        {/* Creator Attribution & Watch Status Card */}
        <div className="flex flex-wrap items-center justify-between gap-3.5 rounded-2xl border border-border-default bg-surface-raised p-4 text-body-sm text-fg shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-full bg-lilac-soft font-extrabold text-primary shadow-xs border border-lilac-deep/30">
              {lesson.teacher[0]}
            </div>
            <div>
              <p className="font-bold text-fg text-body-sm sm:text-body">
                Teacher {lesson.teacher}
              </p>
              <p className="text-caption font-medium text-fg-muted">
                EngVid English Video Lessons · YouTube
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {lesson.teacherChannelUrl && (
              <a
                href={lesson.teacherChannelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-border-default bg-surface-raised px-4.5 py-2.5 text-body-sm font-semibold text-fg transition-colors hover:bg-surface-sunken focus-ring shadow-2xs"
                aria-label={`Visitar canal de YouTube de ${lesson.teacher}`}
              >
                <span>Canal oficial</span>
                <ArrowUpRight className="size-4 text-fg-muted" />
              </a>
            )}

            <button
              type="button"
              onClick={onMarkWatched}
              className={
                isWatched
                  ? 'inline-flex items-center gap-1.5 rounded-full bg-mint text-ink font-bold px-5 py-2.5 text-body-sm border border-ink/15 shadow-xs transition-colors cursor-pointer'
                  : 'inline-flex items-center gap-1.5 rounded-full bg-primary hover:bg-primary-hover text-on-primary font-semibold px-5 py-2.5 text-body-sm shadow-xs focus-ring transition-colors cursor-pointer'
              }
            >
              <Check className="size-4 stroke-[2.5]" />
              <span>{isWatched ? 'Vista' : 'Marcar como vista'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  },
);

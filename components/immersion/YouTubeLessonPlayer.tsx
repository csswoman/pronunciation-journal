'use client';

import { forwardRef, useImperativeHandle, useRef } from 'react';
import { ArrowUpRight } from '@/components/icons';
import type { ImmersionLesson } from '@/lib/immersion/types';

export interface YouTubePlayerHandle {
  seekTo: (seconds: number) => void;
}

interface YouTubeLessonPlayerProps {
  lesson: ImmersionLesson;
  onTimeUpdate?: (seconds: number) => void;
}

export const YouTubeLessonPlayer = forwardRef<YouTubePlayerHandle, YouTubeLessonPlayerProps>(
  function YouTubeLessonPlayer({ lesson }, ref) {
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
          '*'
        );
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({
            event: 'command',
            func: 'playVideo',
            args: [],
          }),
          '*'
        );
      },
    }));

    const embedUrl = `https://www.youtube-nocookie.com/embed/${lesson.youtubeVideoId}?enablejsapi=1&rel=0&modestbranding=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`;

    return (
      <div className="flex flex-col gap-3">
        {/* 16:9 Aspect Ratio Container */}
        <div className="relative w-full overflow-hidden rounded-card-interactive border border-border-default bg-surface-sunken shadow-sm aspect-video">
          <iframe
            ref={iframeRef}
            src={embedUrl}
            title={lesson.title}
            className="absolute inset-0 size-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>

        {/* Creator Attribution & Support Card */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border-default bg-surface-raised px-4 py-3 text-body-sm text-fg">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-full bg-primary-soft font-mono font-bold text-primary">
              {lesson.teacher[0]}
            </div>
            <div>
              <p className="font-semibold text-fg">
                Lección por Teacher {lesson.teacher}
              </p>
              <p className="text-tiny text-fg-muted">
                EngVid English Video Lessons • YouTube
              </p>
            </div>
          </div>

          <a
            href={lesson.teacherChannelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-border-default px-3 py-1.5 text-tiny font-medium text-fg-muted transition-colors hover:bg-surface-sunken hover:text-fg focus-ring"
            aria-label={`Visitar canal de YouTube de ${lesson.teacher}`}
          >
            <span>Canal oficial</span>
            <ArrowUpRight className="size-3.5" />
          </a>
        </div>
      </div>
    );
  }
);

"use client";
import Button from "@/components/ui/Button";

import Link from "next/link";
import ScoreDisplay from "./ScoreDisplay";
import type { WordAttempt } from "@/hooks/useLesson";

interface Props {
  wordAttempts: WordAttempt[];
  sessionAccuracy: number;
  totalXP: number;
  totalWords: number;
  isDynamic: boolean;
  backHref: string;
  lessonData: { title: string };
  onBackToLobby: () => void;
  onRetryLesson: () => void;
}

export default function CompleteSection({
  wordAttempts,
  sessionAccuracy,
  totalXP,
  totalWords,
  isDynamic,
  backHref,
  onBackToLobby,
  onRetryLesson,
}: Props) {
  return (
    <div className="space-y-6">
      <ScoreDisplay wordAttempts={wordAttempts} sessionAccuracy={sessionAccuracy} totalXP={totalXP} totalWords={totalWords} />
      <div className="flex gap-3 justify-center">
        {isDynamic ? (
          <Button
            onClick={onBackToLobby}
            className="px-6 py-3 rounded-xl text-on-primary font-medium transition-colors"
            style={{ backgroundColor: 'var(--primary)' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--btn-regular-bg-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--primary)')}
          >
            ← Back to Stages
          </Button>
        ) : (
          <Button
            onClick={onRetryLesson}
            className="px-6 py-3 rounded-xl text-on-primary font-medium transition-colors"
            style={{ backgroundColor: 'var(--primary)' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--btn-regular-bg-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--primary)')}
          >
            🔄 Retry Lesson
          </Button>
        )}
        <Link href={backHref} className="px-6 py-3 rounded-xl bg-surface-sunken text-fg font-medium hover:bg-border-subtle transition-colors">
          ← All Lessons
        </Link>
      </div>
    </div>
  );
}


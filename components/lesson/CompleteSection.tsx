"use client";

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
          <button
            onClick={onBackToLobby}
            className="px-6 py-3 rounded-xl text-white font-medium transition-colors"
            style={{ backgroundColor: 'var(--primary)' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--btn-regular-bg-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--primary)')}
          >
            ← Back to Stages
          </button>
        ) : (
          <button
            onClick={onRetryLesson}
            className="px-6 py-3 rounded-xl text-white font-medium transition-colors"
            style={{ backgroundColor: 'var(--primary)' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--btn-regular-bg-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--primary)')}
          >
            🔄 Retry Lesson
          </button>
        )}
        <Link href={backHref} className="px-6 py-3 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
          ← All Lessons
        </Link>
      </div>
    </div>
  );
}

"use client";

interface Props {
  word: string;
  ipa: string;
  hint?: string;
  audioUrl: string | null;
  isFav: boolean;
  onToggleFavorite: () => void;
}

export default function WordCard({ word, ipa, hint, audioUrl, isFav, onToggleFavorite }: Props) {
  return (
    <>
      <div className="text-center space-y-4">
        <h2 className="text-[clamp(2.8rem,8vw,4.25rem)] font-semibold leading-none tracking-tight" style={{ color: 'var(--deep-text)' }}>{word}</h2>
        <p className="text-[clamp(1.25rem,3vw,1.75rem)] font-mono" style={{ color: 'var(--primary)' }}>{ipa}</p>
        {hint && (
          <p className="mx-auto max-w-lg text-[15px] leading-6 italic" style={{ color: 'var(--text-secondary)' }}>💡 {hint}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {audioUrl && (
          <button
            onClick={() => new Audio(audioUrl).play()}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-white hover:opacity-90 transition-colors text-base"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
            Listen
          </button>
        )}
        <button
          onClick={onToggleFavorite}
          aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
          className="p-3 rounded-xl transition-colors"
          style={{ backgroundColor: 'var(--btn-regular-bg)' }}
        >
          {isFav ? (
            <svg className="w-7 h-7 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          ) : (
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--text-tertiary)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          )}
        </button>
      </div>
    </>
  );
}

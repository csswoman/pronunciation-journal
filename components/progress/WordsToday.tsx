'use client'

import Link from 'next/link'

interface WordEntry {
  word: string
  partOfSpeech?: string
  isNew?: boolean
}

interface WordsTodayProps {
  words: string[] | WordEntry[]
  newCount?: number
  reviewCount?: number
}

function normalize(words: string[] | WordEntry[]): WordEntry[] {
  if (words.length === 0) return []
  if (typeof words[0] === 'string') {
    return (words as string[]).map((w) => ({ word: w }))
  }
  return words as WordEntry[]
}

const POS_ABBR: Record<string, string> = {
  noun: 'noun',
  verb: 'verb',
  adjective: 'adj',
  adverb: 'adv',
  preposition: 'prep',
  conjunction: 'conj',
  pronoun: 'pron',
}

export default function WordsToday({ words, newCount, reviewCount }: WordsTodayProps) {
  const entries = normalize(words)

  // Derive counts if not provided
  const derivedNew = newCount ?? entries.filter((e) => e.isNew).length
  const derivedReview = reviewCount ?? entries.filter((e) => !e.isNew).length

  return (
    <div className="rounded-3xl border border-[var(--line-divider)] bg-[var(--card-bg)] p-5 shadow-[0_1px_3px_var(--line-divider),0_8px_20px_var(--line-divider)]">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-tiny font-bold uppercase tracking-[0.24em] text-fg-subtle">
            WORDS TODAY
          </p>
          {entries.length > 0 ? (
            <p className="text-sm font-semibold mt-0.5 text-fg">
              {derivedNew > 0 && <span>{derivedNew} new · </span>}
              {derivedReview > 0 && <span>{derivedReview} reviewed</span>}
              {derivedNew === 0 && derivedReview === 0 && `${entries.length} studied`}
            </p>
          ) : (
            <p className="text-sm font-semibold mt-0.5 text-fg-muted">
              No words yet today
            </p>
          )}
        </div>
        <Link
          href="/decks"
          className="shrink-0 text-xs font-semibold text-[var(--primary)] transition-opacity hover:opacity-70"
        >
          Vocabulary →
        </Link>
      </div>

      {/* Word list */}
      {entries.length > 0 ? (
        <div className="mt-4 space-y-0">
          {entries.map((entry, i) => (
            <div key={`${entry.word}-${i}`} className={`flex items-center justify-between py-2 ${i < entries.length - 1 ? "border-b border-[var(--line-divider)]" : ""}`}>
              <span
                className="text-sm font-medium text-fg"
              >
                {entry.word}
              </span>
              <div className="flex items-center gap-3 shrink-0">
                {entry.partOfSpeech && (
                  <span className="text-xs text-fg-subtle">
                    {POS_ABBR[entry.partOfSpeech] ?? entry.partOfSpeech}
                  </span>
                )}
                <span className={`text-tiny font-bold uppercase tracking-wide ${entry.isNew ? "text-[var(--primary)]" : "text-[var(--text-tertiary)]"}`}>
                  {entry.isNew ? 'NEW' : 'REVIEW'}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl bg-[var(--btn-regular-bg)] p-4 text-center">
          <p className="text-sm text-fg-muted">
            Start a practice or review session and your studied words will appear here.
          </p>
          <Link
            href="/daily"
            className="mt-3 inline-block rounded-xl bg-[color-mix(in_oklch,var(--primary)_15%,transparent)] px-4 py-2 text-xs font-semibold text-[var(--primary)] transition-opacity hover:opacity-80"
          >
            Go to practice
          </Link>
        </div>
      )}
    </div>
  )
}

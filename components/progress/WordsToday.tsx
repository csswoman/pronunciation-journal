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
    <div
      className="rounded-[26px] p-5"
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--line-divider)',
        boxShadow: '0 1px 3px var(--line-divider), 0 8px 20px var(--line-divider)',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-tiny font-bold uppercase tracking-[0.24em]" style={{ color: 'var(--text-tertiary)' }}>
            WORDS TODAY
          </p>
          {entries.length > 0 ? (
            <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--deep-text)' }}>
              {derivedNew > 0 && <span>{derivedNew} new · </span>}
              {derivedReview > 0 && <span>{derivedReview} reviewed</span>}
              {derivedNew === 0 && derivedReview === 0 && `${entries.length} studied`}
            </p>
          ) : (
            <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              No words yet today
            </p>
          )}
        </div>
        <Link
          href="/decks"
          className="text-xs font-semibold transition-opacity hover:opacity-70 shrink-0"
          style={{ color: 'var(--primary)' }}
        >
          Vocabulary →
        </Link>
      </div>

      {/* Word list */}
      {entries.length > 0 ? (
        <div className="mt-4 space-y-0">
          {entries.map((entry, i) => (
            <div
              key={`${entry.word}-${i}`}
              className="flex items-center justify-between py-2"
              style={{
                borderBottom: i < entries.length - 1 ? '1px solid var(--line-divider)' : 'none',
              }}
            >
              <span
                className="text-sm font-medium"
                style={{ color: 'var(--deep-text)' }}
              >
                {entry.word}
              </span>
              <div className="flex items-center gap-3 shrink-0">
                {entry.partOfSpeech && (
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {POS_ABBR[entry.partOfSpeech] ?? entry.partOfSpeech}
                  </span>
                )}
                <span
                  className="text-tiny font-bold uppercase tracking-wide"
                  style={{
                    color: entry.isNew
                      ? 'var(--primary)'
                      : 'var(--text-tertiary)',
                  }}
                >
                  {entry.isNew ? 'NEW' : 'REVIEW'}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="mt-4 rounded-2xl p-4 text-center"
          style={{ background: 'var(--btn-regular-bg)' }}
        >
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Start a practice or review session and your studied words will appear here.
          </p>
          <Link
            href="/practice"
            className="inline-block mt-3 px-4 py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
            style={{
              background: 'color-mix(in oklch, var(--primary) 15%, transparent)',
              color: 'var(--primary)',
            }}
          >
            Go to practice
          </Link>
        </div>
      )}
    </div>
  )
}


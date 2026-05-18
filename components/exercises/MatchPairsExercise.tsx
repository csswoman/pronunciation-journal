'use client'

// Planned structure:
// <MatchPairsExercise>
//   <LeftColumn (words) />
//   <RightColumn (definitions) — shuffled />
//   <ResultFeedback />

import { useMemo, useState } from 'react'
import { shuffle } from '@/lib/exercises/utils'
import type { MatchPairsExercise as MatchPairsExerciseType } from '@/lib/exercises/types'

interface Props {
  exercise: MatchPairsExerciseType
  onSubmit: (isCorrect: boolean, userAnswer: string) => void
}

type MatchResult = Record<string, 'correct' | 'wrong' | null>

export function MatchPairsExercise({ exercise, onSubmit }: Props) {
  const rightItems = useMemo(
    () => shuffle(exercise.pairs.map(p => ({ id: p.id, label: p.right }))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [exercise.id]
  )

  const [selectedLeft, setSelectedLeft] = useState<string | null>(null)
  const [matches, setMatches] = useState<Record<string, string>>({}) // leftId → rightId
  const [results, setResults] = useState<MatchResult>({})
  const [submitted, setSubmitted] = useState(false)

  const matchedRightIds = new Set(Object.values(matches))

  function handleLeftClick(id: string) {
    if (submitted || results[id]) return
    setSelectedLeft(prev => (prev === id ? null : id))
  }

  function handleRightClick(rightId: string) {
    if (submitted || !selectedLeft) return
    // If this right item is already matched, ignore
    if (matchedRightIds.has(rightId) && matches[selectedLeft] !== rightId) return
    setMatches(prev => ({ ...prev, [selectedLeft]: rightId }))
    setSelectedLeft(null)
  }

  function handleCheck() {
    if (submitted) return
    const newResults: MatchResult = {}
    let allCorrect = true

    for (const pair of exercise.pairs) {
      const matched = matches[pair.id]
      const correct = matched === pair.id
      newResults[pair.id] = correct ? 'correct' : 'wrong'
      if (!correct) allCorrect = false
    }

    setResults(newResults)
    setSubmitted(true)
    onSubmit(allCorrect, JSON.stringify(matches))
  }

  const allMatched = exercise.pairs.every(p => matches[p.id])

  return (
    <div className="flex flex-col gap-5 w-full">
      <p className="text-[15px] text-[var(--text-secondary)] text-center m-0">
        Match each word with its definition
      </p>

      <div className="grid grid-cols-2 gap-3">
        {/* Left column: words */}
        <div className="flex flex-col gap-2">
          {exercise.pairs.map(pair => {
            const result = results[pair.id]
            const isSelected = selectedLeft === pair.id
            const isMatched = !!matches[pair.id]

            return (
              <button
                key={pair.id}
                type="button"
                onClick={() => handleLeftClick(pair.id)}
                disabled={submitted || !!result}
                className={[
                  'rounded-[var(--radius-md)] py-3 px-3 text-[14px] font-semibold border border-[1.5px] border-solid transition-all duration-200 text-left cursor-pointer min-h-[48px]',
                  result === 'correct' ? 'bg-[var(--success-soft)] border-[var(--success-border)] text-[var(--success)] cursor-default' : '',
                  result === 'wrong' ? 'bg-[var(--error-soft)] border-[var(--error-border)] text-[var(--error)] cursor-default' : '',
                  !result && isSelected ? 'bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--primary)]' : '',
                  !result && !isSelected && isMatched ? 'bg-[var(--surface-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)]' : '',
                  !result && !isSelected && !isMatched ? 'bg-[var(--surface-raised)] border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--primary)]' : '',
                ].join(' ')}
              >
                {pair.left}
              </button>
            )
          })}
        </div>

        {/* Right column: definitions — shuffled */}
        <div className="flex flex-col gap-2">
          {rightItems.map(item => {
            const leftId = Object.keys(matches).find(l => matches[l] === item.id)
            const result = leftId ? results[leftId] : undefined
            const isSelected = selectedLeft !== null && !matchedRightIds.has(item.id)

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleRightClick(item.id)}
                disabled={submitted || !!leftId}
                className={[
                  'rounded-[var(--radius-md)] py-3 px-3 text-[13px] border border-[1.5px] border-solid transition-all duration-200 text-left cursor-pointer min-h-[48px]',
                  result === 'correct' ? 'bg-[var(--success-soft)] border-[var(--success-border)] text-[var(--success)] cursor-default' : '',
                  result === 'wrong' ? 'bg-[var(--error-soft)] border-[var(--error-border)] text-[var(--error)] cursor-default' : '',
                  !result && !!leftId ? 'bg-[var(--surface-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)]' : '',
                  !result && !leftId && isSelected ? 'hover:border-[var(--primary)] hover:bg-[var(--primary-soft)]' : '',
                  !result && !leftId ? 'bg-[var(--surface-raised)] border-[var(--border-subtle)] text-[var(--text-primary)]' : '',
                ].join(' ')}
              >
                {item.label}
              </button>
            )
          })}
        </div>
      </div>

      {!submitted && (
        <button
          type="button"
          onClick={handleCheck}
          disabled={!allMatched}
          className={[
            'w-full py-4 rounded-[var(--radius-md)] border-0 text-[15px] font-semibold transition-all duration-[250ms]',
            allMatched
              ? 'cursor-pointer bg-[var(--gradient-primary)] text-white'
              : 'cursor-not-allowed bg-[var(--surface-raised)] text-[var(--text-tertiary)]',
          ].join(' ')}
        >
          Check
        </button>
      )}
    </div>
  )
}

'use client'

// Planned structure:
// <WordRainFallingWord>
//   <WordPill>
//     <WordTextWithMatchedPrefix />
//     <PhoneticAnnotation />
//   </WordPill>
// </WordRainFallingWord>

import type { FallingWordItem } from '@/lib/exercises/word-rain/types'

interface WordRainFallingWordProps {
  item: FallingWordItem
  typedText: string
}

export default function WordRainFallingWord({
  item,
  typedText,
}: WordRainFallingWordProps) {
  const cleanTyped = typedText.trim().toLowerCase()
  const isPrefixMatch =
    cleanTyped.length > 0 && item.word.toLowerCase().startsWith(cleanTyped)
  const matchedLength = isPrefixMatch ? cleanTyped.length : 0

  const matchedPart = item.word.slice(0, matchedLength)
  const remainingPart = item.word.slice(matchedLength)

  return (
    <div
      className={`absolute -translate-x-1/2 transition-transform duration-75 select-none pointer-events-none ${
        item.isMatched ? 'scale-125 opacity-0 duration-300' : 'scale-100 opacity-100'
      }`}
      style={{
        top: `${item.yPercent}%`,
        left: `${item.xPercent}%`,
      }}
      aria-hidden="true"
    >
      <div
        className={`flex flex-col items-center rounded-xl border px-3.5 py-1.5 shadow-sm backdrop-blur-xs transition-colors duration-150 ${
          isPrefixMatch
            ? 'border-primary/50 bg-primary-soft/90 ring-2 ring-primary/30'
            : 'border-border-default bg-surface-raised/95'
        }`}
      >
        <div className="flex items-center text-sm sm:text-base font-bold tracking-wide font-sans">
          {isPrefixMatch ? (
            <>
              <span className="text-primary underline decoration-2 underline-offset-2">
                {matchedPart}
              </span>
              <span className="text-fg">{remainingPart}</span>
            </>
          ) : (
            <span className="text-fg">{item.word}</span>
          )}
        </div>

        {item.ipa && (
          <span className="font-ipa text-tiny text-fg-subtle opacity-85">
            {item.ipa}
          </span>
        )}
      </div>
    </div>
  )
}

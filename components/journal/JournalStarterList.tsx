import { cn } from '@/lib/cn'
import type { WritingScaffold } from '@/lib/journal/writing-scaffold'

// Planned structure:
// <JournalStarterList>
//   {starters.map => <StarterCard />}
// </JournalStarterList>

interface JournalStarterListProps {
  starters: WritingScaffold['sentence_starters']
  activeIndex: number
  onSelectStarter?: (starter: string) => void
  /** Vocabulary words to highlight inside starters (e.g. ["reply", "remember"]). */
  vocabWords?: string[]
}

export function JournalStarterList({
  starters,
  activeIndex,
  onSelectStarter,
  vocabWords = [],
}: JournalStarterListProps) {
  return (
    <ul className="flex flex-col gap-2">
      {starters.map((starter, index) => {
        const isSuggested = index === activeIndex
        return (
          <li key={starter.en}>
            <button
              type="button"
              onClick={() => onSelectStarter?.(starter.en)}
              data-hint-active={isSuggested ? 'true' : undefined}
              className={cn(
                'focus-ring w-full rounded-[var(--radius-sm)] border px-3 py-2.5 text-left transition-colors',
                isSuggested
                  ? 'border-primary bg-surface-sunken'
                  : 'border-border-default bg-surface-sunken hover:border-border-hover hover:bg-surface-raised',
              )}
            >
              {/* English — primary, with vocab word highlighted */}
              <span className="block font-body-sm font-medium text-fg">
                {renderWithVocabHighlight(starter.en, vocabWords)}
              </span>
              {/* Spanish — secondary */}
              <span className="mt-0.5 block font-body-sm text-fg-muted">
                {starter.es}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

/**
 * Resalta las palabras del vocabulario que aparecen en el texto del starter.
 * Compara contra formas flexionadas básicas: plurales, pasados, gerundios.
 */
function renderWithVocabHighlight(en: string, vocabWords: string[]): React.ReactNode {
  if (vocabWords.length === 0) return en

  // Tokenize preserving whitespace/punctuation
  const tokens = en.split(/(\s+|[.,!?;:…]+)/)

  return tokens.map((token, i) => {
    // Solo procesar tokens alfabéticos
    if (!/^[A-Za-z]/.test(token)) return token

    if (isVocabMatch(token, vocabWords)) {
      return (
        <span key={i} className="font-semibold text-primary">
          {token}
        </span>
      )
    }
    return token
  })
}

/** Verdadero si el token (en cualquier forma) corresponde a una palabra de vocab. */
function isVocabMatch(token: string, vocabWords: string[]): boolean {
  const norm = token.toLowerCase().replace(/[.,!?;:…]$/, '')
  return vocabWords.some((word) => {
    const w = word.toLowerCase()
    return (
      norm === w ||                                              // exact: "remember"
      norm === w + 's' ||                                       // plural/3sg: "remembers"
      norm === w + 'ed' ||                                      // regular past: "shared"
      norm === w + 'd' ||                                       // e-ending past: "mentioned" <- "mention" no, but "share" -> "shared" covered above
      norm === w + 'ing' ||                                     // gerund: "sharing"
      // y → ied / ies
      (w.endsWith('y') && norm === w.slice(0, -1) + 'ied') ||  // "reply" -> "replied"
      (w.endsWith('y') && norm === w.slice(0, -1) + 'ies') ||  // "reply" -> "replies"
      // double consonant + ed/ing (basic): "mention" -> "mentioned" (just -ed works)
      // stem match: token starts with vocab word (for "conversation" in "conversations")
      (norm.startsWith(w) && norm.length <= w.length + 3)
    )
  })
}

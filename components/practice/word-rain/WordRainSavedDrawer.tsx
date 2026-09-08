'use client'

// Planned structure:
// <WordRainSavedDrawer>
//   <DrawerHeader>
//     <DrawerTitleWithBadge />
//     <DrawerCounter />
//   </DrawerHeader>
//   <SavedWordsScrollableList>
//     <SavedWordRow />
//   </SavedWordsScrollableList>
// </WordRainSavedDrawer>

import type { RainWord } from '@/lib/exercises/word-rain/types'
import { BookmarkCheck, Volume2 } from '@/components/icons'

interface WordRainSavedDrawerProps {
  savedWords: RainWord[]
  isOpen?: boolean
  onToggle?: () => void
}

function playSpeech(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-US'
  utterance.rate = 0.9
  window.speechSynthesis.speak(utterance)
}

export default function WordRainSavedDrawer({
  savedWords,
}: WordRainSavedDrawerProps) {
  return (
    <aside
      className="flex flex-col rounded-2xl border border-border-subtle bg-surface-raised p-4 shadow-xs w-full lg:w-72 shrink-0 max-h-[480px] overflow-hidden"
      aria-label="Palabras guardadas durante la partida"
    >
      <div className="flex items-center justify-between border-b border-border-subtle pb-3">
        <div className="flex items-center gap-2">
          <BookmarkCheck size={18} className="text-primary" aria-hidden="true" />
          <h3 className="text-body-sm font-semibold text-fg">Palabras guardadas</h3>
        </div>
        <span className="inline-flex items-center rounded-full bg-primary-soft px-2 py-0.5 font-mono text-tiny font-medium text-primary">
          {savedWords.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pt-3 pr-1 space-y-2">
        {savedWords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-fg-subtle">
            <p className="text-caption">Escribe palabras para guardarlas aquí</p>
          </div>
        ) : (
          savedWords.map((item, idx) => (
            <div
              key={`${item.id}-${idx}`}
              className="group flex items-center justify-between gap-2 rounded-xl border border-border-subtle bg-surface px-3 py-2 transition-colors hover:border-primary/30 hover:bg-surface-sunken"
            >
              <div className="flex flex-col min-w-0">
                <span className="text-body-sm font-medium text-fg capitalize truncate">
                  {item.word}
                </span>
                {item.ipa && (
                  <span className="font-ipa text-tiny text-fg-subtle">
                    {item.ipa}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => playSpeech(item.word)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border-subtle bg-surface-raised text-fg-muted hover:text-primary transition-colors focus-ring"
                title={`Escuchar ${item.word}`}
                aria-label={`Escuchar ${item.word}`}
              >
                <Volume2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </aside>
  )
}

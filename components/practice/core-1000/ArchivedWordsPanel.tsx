'use client'

import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import Button from '@/components/ui/Button'
import { db, unarchiveCore1000Word } from '@/lib/db'
import { CORE1000_PREFIX } from '@/lib/core-1000/types'

type ArchivedWord = {
  word: string
  archivedAt?: string
}

export function ArchivedWordsPanel() {
  const [restoringWord, setRestoringWord] = useState<string | null>(null)

  const archivedWords = useLiveQuery(
    async () => {
      const rows = await db.srsData
        .filter((entry) => entry.wordId.startsWith(CORE1000_PREFIX) && !!entry.archived)
        .toArray()

      return rows
        .map((entry) => ({ word: entry.word, archivedAt: entry.archivedAt }))
        .sort((a, b) => (b.archivedAt ?? '').localeCompare(a.archivedAt ?? ''))
    },
    [],
  ) as ArchivedWord[] | undefined

  const words = archivedWords ?? []

  if (words.length === 0) return null

  const handleRestore = async (word: string) => {
    setRestoringWord(word)
    try {
      await unarchiveCore1000Word(word)
    } finally {
      setRestoringWord(null)
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-border-subtle bg-surface-raised px-5 py-4 shadow-sm">
      <div className="flex flex-col gap-1">
        <p className="m-0 text-xs font-semibold uppercase tracking-[0.12em] text-fg-subtle">
          Ya conocidas
        </p>
        <h2 className="m-0 text-lg text-fg">
          {words.length} {words.length === 1 ? 'palabra archivada' : 'palabras archivadas'}
        </h2>
        <p className="m-0 text-sm text-fg-muted">
          Si quieres que alguna vuelva a aparecer en tus sesiones, restáurala aquí.
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {words.map(({ word }) => (
          <div
            key={word}
            className="flex items-center gap-2 rounded-full border border-border-subtle bg-surface-sunken px-3 py-2"
          >
            <span className="text-sm font-medium text-fg">{word}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              isLoading={restoringWord === word}
              onClick={() => void handleRestore(word)}
            >
              Restaurar
            </Button>
          </div>
        ))}
      </div>
    </section>
  )
}

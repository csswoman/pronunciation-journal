'use client'

// Planned structure:
// <ReaderEntry>
//   state: mode ('catalog' | 'reading')
//   catalog mode:
//     <ReaderCatalog />
//     <CreateStoryModal />
//   reading mode:
//     <BackToCatalogBar />
//     <ReaderExercise />
//   loading state: <WordCarousel />
// </ReaderEntry>

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getMyWords } from '@/lib/word-bank/queries'
import { saveReaderPassage } from '@/lib/db'
import {
  generateReaderPassage,
  resolveReaderLevel,
  getUserReaderPassages,
  deleteUserReaderPassage,
} from '@/lib/practice/reader/queries'
import { pickTargets, type ReaderTargetRow, type ReaderTarget } from '@/lib/practice/reader/select-targets'
import { fetchEssentialWordsForDay } from '@/lib/essential-words/client-fetch'
import type { ReaderPassage } from '@/lib/practice/reader/types'
import type { CEFRLevel } from '@/lib/exercises/cefr'
import { completeReader } from '@/lib/practice/reader/complete-reader'
import { WordCarousel } from '@/components/practice/session/WordCarousel'
import { useLoadingWords } from '@/hooks/useLoadingWords'
import { ArrowLeft } from '@/components/icons'
import { ReaderCatalog } from './ReaderCatalog'
import { ReaderExercise } from './ReaderExercise'
import { CreateStoryModal } from './CreateStoryModal'

async function resolveTargets(offset = 0): Promise<ReaderTarget[] | null> {
  const words = await getMyWords()
  const rows: ReaderTargetRow[] = words.map((w) => ({
    srsId: `wb:${w.id}`,
    word: w.text,
    status: w.srs_status ?? 'new',
    nextReview: w.next_review_at ?? '',
  }))
  let targets = pickTargets(rows)
  if (!targets) {
    const dayOfYear = Math.floor(Date.now() / 86_400_000)
    const fallbackWords = await fetchEssentialWordsForDay(dayOfYear + offset, 5)
    if (fallbackWords.length >= 3) {
      targets = fallbackWords.map((w) => ({
        srsId: w.id,
        word: w.text,
      }))
    }
  }
  return targets
}

export function ReaderEntry() {
  const { user } = useAuth()
  const loadingWords = useLoadingWords()
  const [online, setOnline] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [userLevel, setUserLevel] = useState<CEFRLevel>('B1')
  const [previewWords, setPreviewWords] = useState<string[]>([])
  const [passages, setPassages] = useState<ReaderPassage[]>([])
  const [selectedPassage, setSelectedPassage] = useState<ReaderPassage | null>(null)
  const [mode, setMode] = useState<'catalog' | 'reading'>('catalog')

  useEffect(() => {
    setOnline(navigator.onLine)
  }, [])

  const loadCatalog = useCallback(async () => {
    if (!user) return
    try {
      const [items, level, targets] = await Promise.all([
        getUserReaderPassages(user.id),
        resolveReaderLevel(user.id, 'B1'),
        resolveTargets(0),
      ])
      setPassages(items)
      setUserLevel(level)
      if (targets) {
        setPreviewWords(targets.map((t) => t.word))
      }
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    void loadCatalog()
  }, [loadCatalog])

  const handleDeletePassage = useCallback(
    async (passage: ReaderPassage) => {
      setPassages((prev) => prev.filter((p) => p.id !== passage.id))
      await deleteUserReaderPassage(passage.id)
    },
    [],
  )

  const handleCreateStory = useCallback(
    async ({ topic, level }: { topic?: string; level: CEFRLevel }) => {
      if (!user) return
      setIsGenerating(true)

      try {
        const targets = await resolveTargets(passages.length)
        if (!targets || targets.length === 0) {
          throw new Error('No hay suficientes palabras para generar la lectura')
        }

        const freshPassage = await generateReaderPassage(
          user.id,
          targets,
          level,
          topic,
        )

        await saveReaderPassage(freshPassage)
        setSelectedPassage(freshPassage)
        setMode('reading')
        setIsModalOpen(false)
        await loadCatalog()
      } finally {
        setIsGenerating(false)
      }
    },
    [user, passages.length, loadCatalog],
  )

  if (isLoading) {
    return (
      <div className="flex w-full flex-col items-center justify-center rounded-card border border-border-default bg-surface-raised p-8 sm:p-12 shadow-xs min-h-[360px]">
        <WordCarousel words={loadingWords} />
        <p className="mt-3 text-caption text-fg-muted animate-pulse">
          Cargando biblioteca de lecturas…
        </p>
      </div>
    )
  }

  if (mode === 'reading' && selectedPassage) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto">
        <div className="flex items-center justify-between border-b border-border-default pb-4">
          <button
            type="button"
            onClick={() => {
              setMode('catalog')
              void loadCatalog()
            }}
            className="inline-flex items-center gap-1.5 text-body-sm font-medium text-fg-muted transition-colors hover:text-fg focus-ring rounded py-1 px-2 -ml-2"
          >
            <ArrowLeft className="size-4" />
            <span>Volver a la biblioteca de lecturas</span>
          </button>
        </div>

        <ReaderExercise
          passage={selectedPassage}
          online={online}
          onComplete={async (correct) => {
            if (!user) return
            await completeReader({
              userId: user.id,
              passageId: selectedPassage.id,
              correct,
              context: 'practice',
            })
            await loadCatalog()
          }}
        />
      </div>
    )
  }

  return (
    <>
      <ReaderCatalog
        passages={passages}
        onSelectPassage={(p) => {
          setSelectedPassage(p)
          setMode('reading')
        }}
        onDeletePassage={handleDeletePassage}
        onGenerateNew={() => setIsModalOpen(true)}
        isGenerating={isGenerating}
        online={online}
      />
      <CreateStoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateStory}
        isGenerating={isGenerating}
        initialLevel={userLevel}
        targetWordsPreview={previewWords}
      />
    </>
  )
}

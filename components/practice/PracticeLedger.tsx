'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import type { Sound } from '@/lib/phoneme-practice/types'

type Category = 'all' | 'vowels' | 'consonants' | 'diphthongs'

type SoundStatus = 'locked' | 'available' | 'practicing' | 'mastered'

interface PracticeLedgerProps {
  sounds: Sound[]
  onSelectSound: (soundId: number) => void
  soundStatuses: Record<number, SoundStatus>
  dueCount?: number
  onStartReview?: () => void
}

export function PracticeLedger({ sounds, onSelectSound, soundStatuses, dueCount = 0, onStartReview }: PracticeLedgerProps) {
  // Default to the category that has the most unlocked sounds
  const defaultCategory = (): Category => {
    const counts = { vowels: 0, consonants: 0, diphthongs: 0 }
    sounds.forEach(s => {
      const status = soundStatuses[s.id]
      if (status && status !== 'locked') {
        if (s.category === 'vowel') counts.vowels++
        else if (s.category === 'consonant') counts.consonants++
        else if (s.category === 'diphthong') counts.diphthongs++
      }
    })
    if (counts.vowels >= counts.consonants && counts.vowels >= counts.diphthongs) return 'vowels'
    if (counts.consonants >= counts.diphthongs) return 'consonants'
    return 'diphthongs'
  }
  const [selectedCategory, setSelectedCategory] = useState<Category>(defaultCategory)

  const categories = [
    { id: 'vowels' as const, label: 'Vowels' },
    { id: 'consonants' as const, label: 'Consonants' },
    { id: 'diphthongs' as const, label: 'Diphthongs' },
  ]

  const filteredSounds = sounds.filter(sound => {
    if (selectedCategory === 'all') return true
    if (selectedCategory === 'vowels') return sound.category === 'vowel'
    if (selectedCategory === 'consonants') return sound.category === 'consonant'
    if (selectedCategory === 'diphthongs') return sound.category === 'diphthong'
    return false
  })

  const getStatusColor = (status: SoundStatus) => {
    switch (status) {
      case 'locked':
        return 'bg-[var(--btn-regular-bg)] text-[var(--text-tertiary)]'
      case 'available':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
      case 'practicing':
        return 'bg-[var(--primary)] text-white border border-[var(--primary)]'
      case 'mastered':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700'
    }
  }

  const getStatusIcon = (status: SoundStatus) => {
    switch (status) {
      case 'locked':
        return '🔒'
      case 'available':
        return '●'
      case 'practicing':
        return '●'
      case 'mastered':
        return '✓'
    }
  }

  const getStatusBadge = (status: SoundStatus) => {
    switch (status) {
      case 'locked':
        return 'Locked'
      case 'available':
        return 'Available'
      case 'practicing':
        return 'Practicing'
      case 'mastered':
        return 'Mastered'
    }
  }

  return (
    <div className="w-full space-y-4">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">Practice Ledger</h2>

      {/* Review banner */}
      {dueCount > 0 && onStartReview && (
        <div className="flex items-center justify-between rounded-xl px-4 py-3 border"
          style={{ backgroundColor: 'oklch(.9 .08 25)', borderColor: 'var(--admonitions-color-caution)' }}
        >
          <div>
            <p className="text-sm font-semibold" style={{ color: 'oklch(.5 .2 25)' }}>
              {dueCount} sound{dueCount > 1 ? 's' : ''} ready for review
            </p>
            <p className="text-xs" style={{ color: 'oklch(.6 .15 25)' }}>Keep your streak going!</p>
          </div>
          <Button
            type="button"
            onClick={onStartReview}
            variant="primary"
            size="sm"
            className="rounded-lg px-4 py-1.5 text-sm font-semibold text-white"
            style={{ backgroundColor: 'oklch(.6 .2 25)' }}
          >
            Start Review →
          </Button>
        </div>
      )}

      {/* Category Filters */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => (
          <Button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            variant="chip"
            size="sm"
            selected={selectedCategory === cat.id}
            className="rounded-full px-4 py-2 text-sm font-medium"
          >
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Sounds Grid */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
        {filteredSounds.map(sound => {
          const status = soundStatuses[sound.id] || 'available'
          const isLocked = status === 'locked'

          return (
            <Button
              key={sound.id}
              type="button"
              onClick={() => !isLocked && onSelectSound(sound.id)}
              disabled={isLocked}
              variant="outline"
              className={`relative flex h-full min-h-24 w-full flex-col items-stretch justify-start p-4 rounded-lg border-2 text-left transition-all ${
                isLocked
                  ? 'cursor-not-allowed opacity-50'
                  : 'hover:shadow-lg active:scale-95'
              } ${getStatusColor(status)}`}
            >
              <div className="text-center space-y-1">
                <div className="text-lg font-bold">{sound.ipa}</div>
                <div className="text-xs opacity-75">{sound.example}</div>
              </div>

              {/* Status Indicator */}
              <div className="absolute top-2 right-2 text-lg" title={getStatusBadge(status)}>
                {getStatusIcon(status)}
              </div>
            </Button>
          )
        })}
      </div>
    </div>
  )
}

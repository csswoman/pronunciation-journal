'use client'

import { Bell, Settings } from 'lucide-react'
import Button from '@/components/ui/Button'

interface PracticeHeaderProps {
  masteredCount: number
  accuracy: number
  totalAttempts: number
  dueForReview?: number
}

export function PracticeHeader({
  masteredCount,
  accuracy,
  totalAttempts,
  dueForReview = 0,
}: PracticeHeaderProps) {
  return (
    <div className="w-full space-y-6 pb-4">
      {/* Title and Actions */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Phoneme Practice</h1>
        <div className="flex items-center gap-2">
          {dueForReview > 0 && (
            <Button type="button" variant="chip" size="sm" className="rounded-full px-3 py-1 text-sm font-medium bg-[oklch(.9_.08_25)] text-[oklch(.6_.2_25)] flex items-center gap-1">
              ⚠ Due for review
            </Button>
          )}
          <Button type="button" variant="ghost" size="icon" className="rounded-lg" title="Notifications">
            <Bell size={20} className="text-[var(--text-primary)]" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="rounded-lg" title="Settings">
            <Settings size={20} className="text-[var(--text-primary)]" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        {/* Mastered */}
        <div className="bg-[var(--card-bg)] rounded-lg p-3 text-center border border-[var(--line-divider)]">
          <div className="flex items-center justify-center mb-1">
            <span className="text-base">🎖</span>
          </div>
          <div className="text-xl font-bold text-[var(--text-primary)]">{masteredCount}</div>
          <div className="text-xs text-[var(--text-tertiary)]">Mastered<br/>Phonemes</div>
        </div>

        {/* Accuracy */}
        <div className="bg-[var(--card-bg)] rounded-lg p-3 text-center border border-[var(--line-divider)]">
          <div className="flex items-center justify-center mb-1">
            <span className="text-base">🎯</span>
          </div>
          <div className="text-xl font-bold text-[var(--text-primary)]">{accuracy.toFixed(1)}%</div>
          <div className="text-xs text-[var(--text-tertiary)]">Avg. Accuracy</div>
        </div>

        {/* Total Attempts */}
        <div className="bg-[var(--card-bg)] rounded-lg p-3 text-center border border-[var(--line-divider)]">
          <div className="flex items-center justify-center mb-1">
            <span className="text-base">⏱</span>
          </div>
          <div className="text-xl font-bold text-[var(--text-primary)]">{totalAttempts.toLocaleString()}</div>
          <div className="text-xs text-[var(--text-tertiary)]">Total Attempts</div>
        </div>
      </div>
    </div>
  )
}

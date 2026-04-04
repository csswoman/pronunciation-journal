'use client'

import { Mic } from 'lucide-react'

interface ExpertInsightCardProps {
  title: string
  description: string
  soundIpa: string
  currentProgress: number
  durationMinutes: number
  onStartReview: () => void
  isLoading?: boolean
}

export function ExpertInsightCard({
  title,
  description,
  soundIpa,
  currentProgress,
  durationMinutes,
  onStartReview,
  isLoading = false,
}: ExpertInsightCardProps) {
  return (
    <div className="w-full bg-gradient-to-br from-[var(--primary)] to-[oklch(.6_.1_var(--hue))] rounded-2xl p-6 text-white space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="text-xs font-semibold opacity-90 tracking-widest">EXPERT INSIGHT</div>
          <h3 className="text-xl font-bold leading-tight">{title}</h3>
        </div>
        <button className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
          <Mic size={20} className="text-white" />
        </button>
      </div>

      <p className="text-sm leading-relaxed opacity-95">{description}</p>

      {/* Content Split: Left text, Right progress circle */}
      <div className="flex items-end justify-between gap-4">
        <button
          onClick={onStartReview}
          disabled={isLoading}
          className="px-6 py-2 bg-white text-[var(--primary)] font-semibold rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"
        >
          {isLoading ? 'Starting...' : 'Start Review'}
        </button>

        {/* Progress Circle */}
        <div className="flex flex-col items-center">
          <div className="relative w-24 h-24 flex items-center justify-center">
            {/* SVG Circular Progress */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="4"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="white"
                strokeWidth="4"
                fill="none"
                strokeDasharray={`${(currentProgress / 100) * 251.2} 251.2`}
                strokeLinecap="round"
                style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
              />
            </svg>

            {/* Text in center */}
            <div className="text-center z-10">
              <div className="text-2xl font-bold">{soundIpa}</div>
              <div className="text-xs opacity-90">
                {currentProgress}%
                <br />
                PROGRESS
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

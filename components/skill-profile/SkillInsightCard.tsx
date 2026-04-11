'use client'

import Link from 'next/link'
import { generateSkillInsight, getNextAction } from '@/lib/skill-profile/queries'
import type { SkillProfile } from '@/lib/skill-profile/types'

interface SkillInsightCardProps {
  profile: SkillProfile
}

export default function SkillInsightCard({ profile }: SkillInsightCardProps) {
  const insight = generateSkillInsight(profile)
  const nextAction = getNextAction(profile)

  return (
    <div className="rounded-lg border border-accent/20 bg-gradient-to-br from-accent/10 via-transparent to-transparent p-6 mb-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Your Progress Insight
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{insight}</p>

          <Link
            href={nextAction.href}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-accent text-white font-medium hover:bg-accent/90 transition-colors"
          >
            {nextAction.label}
            <span className="ml-2">→</span>
          </Link>
        </div>

        {/* Quick stats box */}
        <div className="hidden sm:flex flex-col gap-3 min-w-max">
          <div className="text-center">
            <div className="text-2xl font-bold text-accent">{profile.overallScore}%</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Overall</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {profile.streak.current}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Day Streak</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {profile.soundsDueToday}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Due Today</div>
          </div>
        </div>
      </div>
    </div>
  )
}

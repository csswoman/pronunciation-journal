'use client'

import { useRouter } from 'next/navigation'
import type { UserSoundProgressWithSound } from '@/lib/phoneme-practice/types'

interface Props {
  progressList: UserSoundProgressWithSound[]
}

const STATUS_STYLES: Record<string, string> = {
  locked:     'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 border-gray-200 dark:border-gray-700 cursor-not-allowed',
  available:  'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/40 cursor-pointer',
  practicing: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/40 cursor-pointer',
  mastered:   'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700 cursor-default',
}

const STATUS_ICON: Record<string, string> = {
  locked: '🔒',
  available: '',
  practicing: '',
  mastered: '✓',
}

export function SoundGrid({ progressList }: Props) {
  const router = useRouter()

  function handleClick(p: UserSoundProgressWithSound) {
    if (p.status === 'locked' || p.status === 'mastered') return
    router.push(`/practice/${p.sound_id}`)
  }

  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
      {progressList.map(p => (
        <button
          key={p.sound_id}
          onClick={() => handleClick(p)}
          title={`${p.sounds.example ?? p.sounds.ipa} — ${p.status}`}
          className={`relative p-3 rounded-xl border text-center transition-all ${STATUS_STYLES[p.status] ?? STATUS_STYLES.locked}`}
        >
          <div className="font-mono font-bold text-sm leading-none">{p.sounds.ipa}</div>
          {p.sounds.example && <div className="text-[10px] mt-1 opacity-70 truncate">{p.sounds.example}</div>}
          {STATUS_ICON[p.status] && (
            <span className="absolute top-1 right-1 text-[10px]">{STATUS_ICON[p.status]}</span>
          )}
        </button>
      ))}
    </div>
  )
}

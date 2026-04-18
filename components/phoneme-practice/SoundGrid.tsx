'use client'

import { useRouter } from 'next/navigation'
import type { UserSoundProgressWithSound } from '@/lib/phoneme-practice/types'

interface Props {
  progressList: UserSoundProgressWithSound[]
}

const STATUS_STYLES: Record<string, string> = {
  locked:     'bg-btn-regular text-[var(--text-tertiary)] border-line-divider cursor-not-allowed',
  available:  'bg-info-light text-info border-[var(--admonitions-color-note)] hover:brightness-95 cursor-pointer',
  practicing: 'bg-warning-light text-warning border-[var(--admonitions-color-warning)] hover:brightness-95 cursor-pointer',
  mastered:   'bg-success-light text-success border-[var(--admonitions-color-tip)] cursor-default',
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
    router.push(`/practice/sound/${p.sound_id}`)
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

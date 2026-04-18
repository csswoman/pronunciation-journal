'use client'

import Link from 'next/link'
import { Trophy, RotateCcw } from 'lucide-react'
import type { MasteredSoundInfo } from '@/hooks/useMasteredSounds'

interface MasteredSectionProps {
  mastered: MasteredSoundInfo[]
}

function AccuracyRing({ value }: { value: number }) {
  const r = 16
  const circ = 2 * Math.PI * r
  const offset = circ - (value / 100) * circ
  const color = value >= 90
    ? 'oklch(.65 .18 145)'
    : value >= 75
    ? 'oklch(.65 .18 85)'
    : 'oklch(.65 .18 30)'

  return (
    <svg width="42" height="42" viewBox="0 0 42 42" className="flex-shrink-0">
      <circle cx="21" cy="21" r={r} fill="none" stroke="var(--line-divider)" strokeWidth="3" />
      <circle
        cx="21" cy="21" r={r}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 21 21)"
      />
      <text x="21" y="25" textAnchor="middle" fontSize="9" fontWeight="700" fill={color}>
        {value}%
      </text>
    </svg>
  )
}

export default function MasteredSection({ mastered }: MasteredSectionProps) {
  if (mastered.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Trophy size={18} style={{ color: 'var(--text-secondary)' }} />
          <h2 className="text-xl font-bold" style={{ color: 'var(--deep-text)' }}>
            Sonidos Dominados
          </h2>
        </div>
        <div
          className="rounded-2xl p-8 text-center"
          style={{
            background: 'var(--card-bg)',
            boxShadow: '0 1px 3px var(--line-divider)',
          }}
        >
          <p className="text-3xl mb-3">🎯</p>
          <p className="font-semibold text-sm" style={{ color: 'var(--deep-text)' }}>
            Aun no dominas ningun sonido
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            Necesitas 15+ intentos, 85% de precision y una racha de 5 correctas.
          </p>
          <Link
            href="/practice"
            className="inline-block mt-4 px-4 py-2 rounded-xl text-sm font-medium"
            style={{
              background: 'color-mix(in oklch, var(--primary) 15%, transparent)',
              color: 'var(--primary)',
            }}
          >
            Empezar a practicar
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy size={18} style={{ color: 'oklch(.7 .18 85)' }} />
          <h2 className="text-xl font-bold" style={{ color: 'var(--deep-text)' }}>
            Sonidos Dominados
          </h2>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{
              background: 'color-mix(in oklch, oklch(.7 .18 85) 20%, transparent)',
              color: 'oklch(.6 .18 85)',
            }}
          >
            {mastered.length}
          </span>
        </div>
        <Link
          href="/practice"
          className="text-xs font-medium"
          style={{ color: 'var(--text-secondary)' }}
        >
          Ver todos
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {mastered.map(sound => (
          <div
            key={sound.sound_id}
            className="rounded-2xl p-4 flex items-center gap-3"
            style={{
              background: 'var(--card-bg)',
              boxShadow: '0 1px 3px var(--line-divider), 0 4px 12px var(--line-divider)',
              borderLeft: '3px solid oklch(.65 .18 145)',
            }}
          >
            {/* IPA + badge */}
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <span
                className="text-2xl font-bold"
                style={{ color: 'var(--primary)', fontFamily: 'monospace' }}
              >
                {sound.sounds.ipa}
              </span>
              <span
                className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{
                  background: 'color-mix(in oklch, oklch(.65 .18 145) 20%, transparent)',
                  color: 'oklch(.5 .18 145)',
                }}
              >
                DOMINADO
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--deep-text)' }}>
                {sound.sounds.example ?? ''}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Racha: {sound.streak} • {sound.total_attempts} intentos
              </p>
              <p
                className="text-xs mt-1 font-medium"
                style={{ color: sound.dueForReview ? 'oklch(.55 .15 30)' : 'var(--text-tertiary)' }}
              >
                {sound.dueForReview ? 'Repaso pendiente' : `Proximo: ${sound.intervalLabel}`}
              </p>
            </div>

            {/* Ring de precision */}
            <AccuracyRing value={sound.accuracy} />

            {/* Boton repasar si toca */}
            {sound.dueForReview && (
              <Link
                href={`/practice/sound/${sound.sound_id}`}
                className="flex-shrink-0 p-2 rounded-xl transition-opacity hover:opacity-70"
                style={{
                  background: 'color-mix(in oklch, var(--primary) 15%, transparent)',
                  color: 'var(--primary)',
                }}
                title="Repasar ahora"
              >
                <RotateCcw size={14} />
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

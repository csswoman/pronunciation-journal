'use client'

import Link from 'next/link'
import { Bell, ChevronRight, CheckCircle2 } from 'lucide-react'
import type { MasteredSoundInfo } from '@/hooks/useMasteredSounds'

// Intervalos del sistema Leitner / SM-2: 1 → 3 → 7 → 30 días
const SRS_INTERVALS = [
  { days: 1,  label: 'Día 1',    description: 'Repaso inicial' },
  { days: 3,  label: 'Día 3',    description: 'Consolidación corta' },
  { days: 7,  label: 'Semana 1', description: 'Memoria de mediano plazo' },
  { days: 30, label: 'Mes 1',    description: 'Memoria de largo plazo' },
]

interface ReviewReminderProps {
  dueToday: MasteredSoundInfo[]
  totalMastered: number
}

export default function ReviewReminder({ dueToday, totalMastered }: ReviewReminderProps) {
  const hasDue = dueToday.length > 0

  return (
    <div
      className="rounded-2xl p-5 space-y-4"
      style={{
        background: 'var(--card-bg)',
        boxShadow: '0 1px 3px var(--line-divider), 0 4px 12px var(--line-divider)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell size={18} style={{ color: hasDue ? 'var(--primary)' : 'var(--text-secondary)' }} />
          <h3 className="font-semibold text-sm" style={{ color: 'var(--deep-text)' }}>
            Repasos del día
          </h3>
          {hasDue && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{
                background: 'color-mix(in oklch, var(--primary) 20%, transparent)',
                color: 'var(--primary)',
              }}
            >
              {dueToday.length}
            </span>
          )}
        </div>
        {hasDue && (
          <Link
            href="/review"
            className="flex items-center gap-1 text-xs font-medium"
            style={{ color: 'var(--primary)' }}
          >
            Repasar ahora <ChevronRight size={14} />
          </Link>
        )}
      </div>

      {/* Estado: sin repasos pendientes */}
      {!hasDue && totalMastered > 0 && (
        <div className="flex items-center gap-3 py-2">
          <CheckCircle2 size={20} style={{ color: 'oklch(.65 .15 145)' }} />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Todo al dia. El sistema te avisara cuando sea hora de repasar.
          </p>
        </div>
      )}

      {/* Sonidos pendientes hoy */}
      {hasDue && (
        <div className="space-y-2">
          {dueToday.slice(0, 4).map(sound => (
            <Link
              key={sound.sound_id}
              href={`/practice/sound/${sound.sound_id}`}
              className="flex items-center justify-between px-3 py-2 rounded-xl transition-colors hover:opacity-80"
              style={{ background: 'var(--line-divider)' }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="text-lg font-bold w-10 text-center"
                  style={{ color: 'var(--primary)', fontFamily: 'monospace' }}
                >
                  {sound.sounds.ipa}
                </span>
                <div>
                  <p className="text-xs font-medium" style={{ color: 'var(--deep-text)' }}>
                    {sound.sounds.example ?? ''}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Precisión: {sound.accuracy}%
                  </p>
                </div>
              </div>
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-md"
                style={{
                  background: 'color-mix(in oklch, oklch(.65 .15 30) 15%, transparent)',
                  color: 'oklch(.55 .15 30)',
                }}
              >
                Repasar
              </span>
            </Link>
          ))}
          {dueToday.length > 4 && (
            <p className="text-xs text-center pt-1" style={{ color: 'var(--text-secondary)' }}>
              +{dueToday.length - 4} más pendientes
            </p>
          )}
        </div>
      )}

      {/* Línea de tiempo SRS */}
      <div className="pt-2 border-t" style={{ borderColor: 'var(--line-divider)' }}>
        <p className="text-xs font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
          Como funciona la repeticion espaciada
        </p>
        <div className="flex items-center gap-1">
          {SRS_INTERVALS.map((interval, i) => (
            <div key={interval.days} className="flex items-center flex-1">
              <div className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: 'var(--primary)', opacity: 0.4 + i * 0.2 }}
                />
                <span className="text-[10px] font-semibold" style={{ color: 'var(--deep-text)' }}>
                  {interval.label}
                </span>
                <span className="text-[9px] text-center leading-tight" style={{ color: 'var(--text-tertiary)' }}>
                  {interval.description}
                </span>
              </div>
              {i < SRS_INTERVALS.length - 1 && (
                <div
                  className="h-px flex-1 mb-4"
                  style={{ background: 'var(--line-divider)' }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

'use client'

// Planned structure:
// <SoundSettingsCard>
//   <SoundPreferenceSelector /> — off | exercise | ui | all
//   <SoundVolumeSlider />       — 0–100% loudness, previews on change
// </SoundSettingsCard>

import { useUISoundsStore, type SoundPreference } from '@/lib/stores/uiSoundsStore'
import { playUiCue } from '@/lib/ui-sounds/cues'
import { cn } from '@/lib/cn'

const PREFERENCE_OPTIONS: Array<{ value: SoundPreference; label: string; description: string }> = [
  { value: 'off', label: 'Silencio', description: 'Sin efectos de sonido' },
  { value: 'exercise', label: 'Ejercicios', description: 'Aciertos, fallos y opciones' },
  { value: 'ui', label: 'Interfaz', description: 'Navegación, paneles y botones' },
  { value: 'all', label: 'Todos', description: 'Ejercicios y sistema completo' },
]

function SoundPreferenceSelector() {
  const soundPreference = useUISoundsStore((s) => s.soundPreference)
  const setSoundPreference = useUISoundsStore((s) => s.setSoundPreference)

  const handleSelect = (val: SoundPreference) => {
    setSoundPreference(val)
    if (val === 'exercise' || val === 'all') {
      playUiCue('correct')
    } else if (val === 'ui') {
      playUiCue('nav-switch')
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-body-sm font-medium text-fg">Preferencia de audio</p>
        <p className="text-caption text-fg-muted">Selecciona dónde quieres escuchar retroalimentación acústica.</p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {PREFERENCE_OPTIONS.map((opt) => {
          const isSelected = soundPreference === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelect(opt.value)}
              className={cn(
                'flex flex-col items-start rounded-xl border p-3 text-left transition-all',
                isSelected
                  ? 'border-[var(--primary)] bg-[var(--primary-soft)] text-fg shadow-sm'
                  : 'border-[var(--border)] bg-[var(--bg-primary)] text-fg-muted hover:border-[var(--primary)]/40 hover:text-fg'
              )}
            >
              <span className={cn('text-xs font-semibold', isSelected && 'text-[var(--primary)]')}>
                {opt.label}
              </span>
              <span className="mt-1 text-[11px] leading-tight text-fg-subtle">
                {opt.description}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function SoundVolumeSlider() {
  const soundPreference = useUISoundsStore((s) => s.soundPreference)
  const volume = useUISoundsStore((s) => s.volume)
  const setVolume = useUISoundsStore((s) => s.setVolume)

  const isMuted = soundPreference === 'off'
  const percent = Math.round(volume * 100)

  const playPreview = () => {
    if (soundPreference === 'exercise' || soundPreference === 'all') {
      playUiCue('correct')
    } else if (soundPreference === 'ui') {
      playUiCue('nav-switch')
    }
  }

  return (
    <div className={cn('space-y-2', isMuted && 'opacity-50 pointer-events-none')}>
      <div className="flex items-center justify-between">
        <label htmlFor="sound-volume" className="text-body-sm font-medium text-fg">
          Volumen maestro
        </label>
        <span className="text-caption font-semibold tabular-nums text-fg-muted">{percent}%</span>
      </div>
      <input
        id="sound-volume"
        type="range"
        min={0}
        max={100}
        step={5}
        value={percent}
        disabled={isMuted}
        onChange={(e) => setVolume(Number(e.target.value) / 100)}
        onPointerUp={playPreview}
        onKeyUp={playPreview}
        className="w-full accent-[var(--primary)]"
      />
    </div>
  )
}

/** Device-level sound preferences with fine granularity (off | exercise | ui | all). */
export default function SoundSettingsCard() {
  return (
    <div className="space-y-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 text-fg-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15.536 8.464a5 5 0 010 7.072M19.07 4.93a10 10 0 010 14.14M6.343 9H4a1 1 0 00-1 1v4a1 1 0 001 1h2.343l4.243 4.243A1 1 0 0012 18.586V5.414a1 1 0 00-1.414-.707L6.343 9z"
          />
        </svg>
        <span className="text-caption font-semibold uppercase tracking-widest text-fg-subtle">Sonido</span>
      </div>
      <SoundPreferenceSelector />
      <div className="border-t border-[var(--border)] pt-4">
        <SoundVolumeSlider />
      </div>
    </div>
  )
}

'use client'

// Planned structure:
// <SoundLab>
//   <SoundLabHeader />       — volume slider, burst trigger, copy status
//   <SoundLabFamilies />     — cue buttons categorized by family
//   <SoundLabEditor />       — live parameter sliders + custom synthesized playback
// </SoundLab>

import { useState, useCallback, useId } from 'react'
import { UI_CUE_SOUNDS, playUiCue, type UiCue } from '@/lib/ui-sounds/cues'
import { RECIPES } from '@/lib/ui-sounds/recipes'
import type { Recipe } from '@/lib/ui-sounds/types'
import { useUISoundsStore, MAX_VOLUME_MULTIPLIER } from '@/lib/stores/uiSoundsStore'
import { cn } from '@/lib/cn'

const FAMILIES: Array<{ name: string; cues: UiCue[] }> = [
  { name: 'Panel', cues: ['nav-open', 'nav-close'] },
  { name: 'Transición', cues: ['nav-switch'] },
  { name: 'Acción Positiva', cues: ['create', 'save', 'duplicate'] },
  { name: 'Acción Negativa', cues: ['delete', 'archive'] },
  { name: 'Progreso', cues: ['streak', 'milestone', 'level-up'] },
  { name: 'Chat', cues: ['message-send', 'message-receive'] },
  { name: 'Ejercicios & Ambient', cues: ['tap', 'correct', 'wrong', 'press', 'release', 'toggle', 'hover', 'reveal', 'soft'] },
]

export function SoundLab() {
  const [selectedCue, setSelectedCue] = useState<UiCue>('nav-switch')
  const [copied, setCopied] = useState(false)
  const [isBursting, setIsBursting] = useState(false)

  const soundName = UI_CUE_SOUNDS[selectedCue]
  const baseRecipe = RECIPES[soundName] as Recipe
  const [customRecipe, setCustomRecipe] = useState<Recipe>(() => JSON.parse(JSON.stringify(baseRecipe)))

  const volume = useUISoundsStore((s) => s.volume)
  const setVolume = useUISoundsStore((s) => s.setVolume)
  const volumeSliderId = useId()

  const handleSelectCue = (cue: UiCue) => {
    setSelectedCue(cue)
    const rec = RECIPES[UI_CUE_SOUNDS[cue]]
    setCustomRecipe(JSON.parse(JSON.stringify(rec)))
    playUiCue(cue)
  }

  const handleBurst = useCallback(() => {
    if (isBursting) return
    setIsBursting(true)
    let count = 0
    const interval = setInterval(() => {
      playUiCue(selectedCue)
      count++
      if (count >= 10) {
        clearInterval(interval)
        setIsBursting(false)
      }
    }, 30)
  }, [selectedCue, isBursting])

  const copyTs = () => {
    const code = `'${selectedCue}': ${JSON.stringify(customRecipe, null, 2)},`
    void navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
        <div>
          <h1 className="text-xl font-bold text-fg">Sound Lab</h1>
          <p className="text-sm text-fg-muted">Afinación acústica y verificación de políticas de voz en vivo.</p>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2">
          <label htmlFor={volumeSliderId} className="text-xs font-semibold uppercase tracking-wider text-fg-muted">Volumen ({Math.round(volume * 100)}%)</label>
          <input
            id={volumeSliderId}
            type="range"
            min={0}
            max={100}
            step={5}
            value={Math.round(volume * 100)}
            onChange={(e) => setVolume(Number(e.target.value) / 100)}
            className="w-24 accent-[var(--primary)]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Panel de familias */}
        <div className="space-y-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-fg-subtle">Familias de Cues</h2>
          {FAMILIES.map((family) => (
            <div key={family.name} className="space-y-2">
              <span className="text-xs font-medium text-fg-muted">{family.name}</span>
              <div className="flex flex-wrap gap-2">
                {family.cues.map((cue) => {
                  const isSelected = selectedCue === cue
                  return (
                    <button
                      key={cue}
                      type="button"
                      onClick={() => handleSelectCue(cue)}
                      className={cn(
                        'rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                        isSelected
                          ? 'bg-[var(--primary)] text-white shadow-sm'
                          : 'border border-[var(--border)] bg-[var(--bg-secondary)] text-fg hover:border-[var(--primary)]'
                      )}
                    >
                      {cue}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Panel de control e inspección */}
        <div className="space-y-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6">
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm font-bold text-[var(--primary)]">{selectedCue}</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleBurst}
                disabled={isBursting}
                className={cn(
                  'rounded-lg px-3 py-1 text-xs font-medium border transition-colors',
                  isBursting ? 'bg-[var(--bg-tertiary)] opacity-60' : 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'
                )}
              >
                {isBursting ? 'Bursting...' : 'Burst 10x'}
              </button>
              <button
                type="button"
                onClick={copyTs}
                className="rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-1 text-xs font-medium text-fg hover:border-[var(--primary)]"
              >
                {copied ? '✓ Copiado' : 'Copy as TS'}
              </button>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between py-1 text-fg-muted">
                <span>Master Gain</span>
                <span className="font-mono">{customRecipe.masterGain} (Live: {(customRecipe.masterGain * volume * MAX_VOLUME_MULTIPLIER).toFixed(2)})</span>
              </div>
              <input
                type="range"
                min={0.05}
                max={1}
                step={0.01}
                value={customRecipe.masterGain}
                onChange={(e) => setCustomRecipe({ ...customRecipe, masterGain: Number(e.target.value) })}
                className="w-full accent-[var(--primary)]"
              />
            </div>

            {customRecipe.layers.map((layer, idx) => (
              <div key={idx} className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-3 space-y-2">
                <span className="font-mono font-semibold text-fg">Layer #{idx + 1} ({layer.kind})</span>
                {layer.kind === 'tone' && (
                  <div className="grid grid-cols-2 gap-2 text-fg-muted">
                    <div>Freq: <span className="font-mono text-fg">{layer.frequency}Hz</span></div>
                    {layer.glideTo && <div>GlideTo: <span className="font-mono text-fg">{layer.glideTo}Hz</span></div>}
                    <div>Attack: <span className="font-mono text-fg">{layer.attack}s</span></div>
                    <div>Decay: <span className="font-mono text-fg">{layer.decay}s</span></div>
                  </div>
                )}
                {layer.kind === 'noise' && (
                  <div className="grid grid-cols-2 gap-2 text-fg-muted">
                    <div>Filter: <span className="font-mono text-fg">{layer.filterType}</span></div>
                    <div>Cutoff: <span className="font-mono text-fg">{layer.filterFrequency}Hz</span></div>
                  </div>
                )}
              </div>
            ))}

            {customRecipe.shimmer && (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-3 text-fg-muted">
                <span className="font-mono font-semibold text-fg">Shimmer</span>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div>Wet: <span className="font-mono text-fg">{customRecipe.shimmer.wet}</span></div>
                  <div>Feedback: <span className="font-mono text-fg">{customRecipe.shimmer.feedback}</span></div>
                  <div>Delay: <span className="font-mono text-fg">{customRecipe.shimmer.delay}s</span></div>
                  <div>Lowpass: <span className="font-mono text-fg">{customRecipe.shimmer.lowpass}Hz</span></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

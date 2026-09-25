// components/ai-coach/missions/scripted/RetryAndContinue.tsx
'use client'

// Planned structure:
// <RetryAndContinue>
//   <button primary purple pill> 🎙️ Repetir « palabra »
//   <button quiet link> Siguiente a mejorar >

import { RotateCcw, ChevronRight } from '@/components/icons'

interface Props {
  onRetry: () => void
  onContinue: () => void
  targetWord?: string
}

/**
 * Acciones finales del turno del estudiante: repetir la locución o avanzar.
 */
export function RetryAndContinue({ onRetry, onContinue, targetWord }: Props) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 w-full">
      <button
        type="button"
        onClick={onRetry}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-full bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold text-sm px-6 py-3 shadow-md hover:shadow-lg transition-all cursor-pointer select-none"
      >
        <RotateCcw size={16} className="shrink-0" aria-hidden />
        <span>{targetWord ? `Repetir « ${targetWord} »` : 'Repetir'}</span>
      </button>

      <button
        type="button"
        onClick={onContinue}
        aria-label="Continuar"
        className="inline-flex items-center gap-1 text-xs font-semibold text-fg-muted hover:text-fg transition-colors cursor-pointer py-2 px-1 select-none"
      >
        <span>Siguiente a mejorar</span>
        <ChevronRight size={14} aria-hidden />
      </button>
    </div>
  )
}


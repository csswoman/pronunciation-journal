'use client'

// Planned structure:
// <ScriptedResult>
//   <ResultIllustration />  (celebracion o animo, segun la puntuacion)
//   <ScoreDisplay />
//   <ImprovementNote />
//   <ResultActions />       (repetir / volver)

import { cn } from '@/lib/cn'
import { getIllustration } from '@/lib/illustrations/registry'
import Button from '@/components/ui/Button'
import { ArrowLeft, RotateCcw } from '@/components/icons'
import type { ScriptSessionScore } from '@/lib/ai-practice/missions/scripted/scoring'
import type { ScriptedMission } from '@/lib/ai-practice/missions/types'

interface Props {
  mission: ScriptedMission
  sessionScore: ScriptSessionScore
  /** Mejor score anterior en este mismo guión, si lo hay. */
  previousBest?: number | null
  onRetry: () => void
  onExit: () => void
}

/** A partir de aquí el resultado se celebra; por debajo se anima a repetir. */
const CELEBRATION_THRESHOLD = 80

function headline(score: number): string {
  if (score >= 90) return '¡Excelente!'
  if (score >= CELEBRATION_THRESHOLD) return '¡Muy bien!'
  if (score >= 60) return 'Vas por buen camino'
  return 'Sigue practicando'
}

export function ScriptedResult({
  mission,
  sessionScore,
  previousBest,
  onRetry,
  onExit,
}: Props) {
  const { score } = sessionScore
  const celebrates = score !== null && score >= CELEBRATION_THRESHOLD
  const improved = score !== null && previousBest != null && score > previousBest

  // `stateCompletado` es la ráfaga de celebración; `domainSpeaking` mantiene
  // el registro visual sin celebrar un resultado que no lo merece.
  const Illustration = getIllustration(celebrates ? 'stateCompletado' : 'domainSpeaking')

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-border-default bg-surface-raised p-6 text-center">
      {/* Solo se fija la altura: estos SVG no son cuadrados y forzar ambos
          ejes los deforma (ver nota de sizing en el registry). */}
      <Illustration
        aria-hidden
        className={cn(
          'h-24 w-auto',
          celebrates ? 'text-[var(--success)]' : 'text-fg-subtle',
        )}
      />

      <h2 className="m-0 text-label font-semibold text-fg">{mission.context}</h2>

      {score === null ? (
        <p className="m-0 text-body text-fg-muted">
          No se pudo evaluar la pronunciación en esta sesión.
        </p>
      ) : (
        <>
          <div
            className={cn(
              'rounded-full px-5 py-2',
              celebrates && 'success-pulse bg-[var(--success-soft)]',
            )}
          >
            <p
              className={cn(
                'm-0 text-display font-bold',
                celebrates ? 'text-[var(--success)]' : 'text-fg',
              )}
            >
              {score}%
            </p>
          </div>

          <p className="m-0 text-body font-medium text-fg">{headline(score)}</p>

          {previousBest != null && (
            <p className="m-0 text-body-sm text-fg-muted">
              {improved
                ? `Mejoraste: antes ${previousBest}%`
                : `Tu mejor marca sigue siendo ${previousBest}%`}
            </p>
          )}
        </>
      )}

      {/* Sin estas acciones la pantalla final era un callejon sin salida. */}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
        <Button
          variant="ghost"
          size="sm"
          icon={<ArrowLeft size={16} aria-hidden />}
          onClick={onExit}
        >
          Volver a misiones
        </Button>
        <Button
          variant="primary"
          size="sm"
          icon={<RotateCcw size={16} aria-hidden />}
          onClick={onRetry}
        >
          Repetir guión
        </Button>
      </div>
    </div>
  )
}

// Planned structure:
// <AccuracyBar>  (label + track + value, no sub-components)

import { cn } from '@/lib/cn'

interface AccuracyBarProps {
  label: string
  /** Precisión 0-100. */
  value: number
  /** Intentos que respaldan el valor; se muestra para que el número sea auditable. */
  sampleCount?: number
  className?: string
}

/** Bajo este umbral la barra se pinta como debilidad, no como progreso. */
const WEAK = 60
const MID = 80

/**
 * Barra horizontal de precisión real por tema.
 *
 * Muestra siempre el número de intentos: "40%" sobre 3 intentos y sobre 60 no
 * significan lo mismo, y ocultarlo haría que el usuario confíe de más en la barra.
 */
export function AccuracyBar({ label, value, sampleCount, className }: AccuracyBarProps) {
  const pct = Math.min(100, Math.max(0, Math.round(value)))
  const color = pct < WEAK ? 'var(--warning)' : pct < MID ? 'var(--primary)' : 'var(--success)'

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-body-sm text-fg">{label}</span>
        <span className="text-tiny tabular-nums font-semibold shrink-0" style={{ color }}>
          {pct}%
        </span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full border border-[var(--line-divider)] bg-surface-sunken"
        role="img"
        aria-label={`${label}: ${pct}% de precisión${sampleCount ? ` en ${sampleCount} intentos` : ''}`}
      >
        <div
          className="h-full rounded-full transition-transform"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      {typeof sampleCount === 'number' && (
        <span className="text-tiny text-fg-subtle">{sampleCount} intentos en 30 días</span>
      )}
    </div>
  )
}

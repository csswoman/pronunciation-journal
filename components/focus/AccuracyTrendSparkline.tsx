// Planned structure:
// <AccuracyTrendSparkline>  (single SVG, no sub-components)

import { cn } from '@/lib/cn'
import { trendDirection } from '@/lib/focus/gap-evidence'

interface AccuracyTrendSparklineProps {
  /** Precisión 0-100 por segmento, del más antiguo al más reciente. null = sin datos. */
  trend: (number | null)[]
  className?: string
}

const WIDTH = 64
const HEIGHT = 20
const PAD = 2

/**
 * Mini línea de tendencia de precisión en los últimos 30 días.
 *
 * Los segmentos sin intentos se saltan en vez de dibujarse como cero: un hueco
 * es "no practicaste", no "fallaste todo". El color sigue la dirección para que
 * la lectura funcione sin leer números.
 */
export function AccuracyTrendSparkline({ trend, className }: AccuracyTrendSparklineProps) {
  const points = trend
    .map((value, index) => ({ value, index }))
    .filter((p): p is { value: number; index: number } => p.value !== null)

  // Con un solo punto no hay línea que trazar y la tendencia no significa nada.
  if (points.length < 2) return null

  const direction = trendDirection(trend)
  const stroke =
    direction === 'up' ? 'var(--success)' : direction === 'down' ? 'var(--warning)' : 'var(--fg-subtle)'

  const stepX = (WIDTH - PAD * 2) / Math.max(1, trend.length - 1)
  const toX = (index: number) => PAD + index * stepX
  const toY = (value: number) => HEIGHT - PAD - (value / 100) * (HEIGHT - PAD * 2)

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(p.index)},${toY(p.value)}`).join(' ')
  const last = points[points.length - 1]

  const directionText =
    direction === 'up' ? 'mejorando' : direction === 'down' ? 'bajando' : 'estable'

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className={cn('h-5 w-16 shrink-0 overflow-visible', className)}
      role="img"
      aria-label={`Tendencia de precisión en 30 días: ${directionText}, ahora ${last.value}%`}
    >
      <path d={path} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={toX(last.index)} cy={toY(last.value)} r={2} fill={stroke} />
    </svg>
  )
}

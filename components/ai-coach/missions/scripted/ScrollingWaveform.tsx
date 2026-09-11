'use client'

// Planned structure:
// <ScrollingWaveform>
//   <CanvasWaveform /> | <ReducedMotionBar />
// </ScrollingWaveform>

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/cn'

interface Props {
  getSamples: () => Uint8Array
  peak?: number
  isActive: boolean
  className?: string
}

const CANVAS_WIDTH = 64
const CANVAS_HEIGHT = 20

/**
 * Visualizador osciloscopio en vivo para la captura de voz del estudiante.
 * Dibuja una forma de onda continua en un elemento canvas con aceleración gráfica,
 * o degrada a una barra de nivel estática si el usuario prefiere movimiento reducido.
 */
export function ScrollingWaveform({
  getSamples,
  peak = 0,
  isActive,
  className,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const isReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    if (isReducedMotion) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = CANVAS_WIDTH * dpr
    canvas.height = CANVAS_HEIGHT * dpr

    let animationId: number | null = null

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (!isActive) return

      const samples = getSamples()
      const length = samples.length
      if (length === 0) return

      ctx.save()
      ctx.scale(dpr, dpr)
      ctx.lineWidth = 1.5
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      const errorColor =
        getComputedStyle(canvas).getPropertyValue('--error').trim() || 'currentColor'
      ctx.strokeStyle = errorColor


      ctx.beginPath()

      const sliceWidth = CANVAS_WIDTH / length
      let x = 0

      for (let i = 0; i < length; i++) {
        const v = (samples[i]! - 128) / 128
        // Exagerar levemente para visibilidad en dimensiones reducidas
        const y = CANVAS_HEIGHT / 2 + v * (CANVAS_HEIGHT / 2) * 0.95

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }

        x += sliceWidth
      }

      ctx.stroke()
      ctx.restore()

      animationId = requestAnimationFrame(draw)
    }

    if (isActive) {
      animationId = requestAnimationFrame(draw)
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }

    return () => {
      if (animationId) cancelAnimationFrame(animationId)
      if (canvas) {
        const c = canvas.getContext('2d')
        c?.clearRect(0, 0, canvas.width, canvas.height)
      }
    }
  }, [isActive, getSamples, isReducedMotion])

  if (isReducedMotion) {
    return (
      <div
        data-testid="reduced-motion-level-bar"
        aria-hidden="true"
        className={cn(
          'flex items-center h-4 w-14 rounded-full bg-error/15 px-1 overflow-hidden',
          className,
        )}
      >
        <span
          className="h-1.5 rounded-full bg-error transition-all duration-100"
          style={{ width: `${Math.min(100, Math.max(8, Math.round(peak * 100)))}%` }}
        />
      </div>
    )
  }

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn('inline-block h-5 w-16 shrink-0', className)}
      style={{ width: `${CANVAS_WIDTH}px`, height: `${CANVAS_HEIGHT}px` }}
    />
  )
}

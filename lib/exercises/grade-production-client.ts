import type {
  GradeProductionInput,
  ProductionGradeResult,
} from '@/lib/exercises/production-grade'
import { publicAiErrorMessage } from '@/lib/degradation/messages'

export type { GradeProductionInput, ProductionGradeResult }

export class ProductionGradeError extends Error {
  constructor(
    message: string,
    readonly code: 'offline' | 'network' | 'server',
  ) {
    super(message)
    this.name = 'ProductionGradeError'
  }
}

export const PRODUCTION_AI_UNAVAILABLE_MESSAGE =
  'El servicio de corrección con IA no está disponible en este momento. Puedes autoevaluar tu oración con el ejemplo o intentarlo de nuevo más tarde.'

/** Client-side call to /api/gemini/grade-production. Requires network. */
export async function gradeProduction(
  input: GradeProductionInput,
): Promise<ProductionGradeResult> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new ProductionGradeError(
      'Necesitas conexión a internet para corregir tu respuesta.',
      'offline',
    )
  }

  let res: Response
  try {
    res = await fetch('/api/gemini/grade-production', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
  } catch {
    throw new ProductionGradeError(
      publicAiErrorMessage(undefined, '', PRODUCTION_AI_UNAVAILABLE_MESSAGE),
      'network',
    )
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null
    throw new ProductionGradeError(
      publicAiErrorMessage(res.status, body?.error, PRODUCTION_AI_UNAVAILABLE_MESSAGE),
      'server',
    )
  }

  return res.json() as Promise<ProductionGradeResult>
}

export function isOnline(): boolean {
  return typeof navigator === 'undefined' || navigator.onLine
}

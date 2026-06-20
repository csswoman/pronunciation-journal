import type {
  GradeProductionInput,
  ProductionGradeResult,
} from '@/lib/exercises/production-grade'

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

/** Client-side call to /api/gemini/grade-production. Requires network. */
export async function gradeProduction(
  input: GradeProductionInput,
): Promise<ProductionGradeResult> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new ProductionGradeError(
      'Free production exercises need an internet connection to grade your answer.',
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
      'Could not reach the grading service. Check your connection and try again.',
      'network',
    )
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null
    throw new ProductionGradeError(
      body?.error ?? 'Grading failed. Please try again.',
      'server',
    )
  }

  return res.json() as Promise<ProductionGradeResult>
}

export function isOnline(): boolean {
  return typeof navigator === 'undefined' || navigator.onLine
}

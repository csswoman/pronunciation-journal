import type { EvidenceModality } from '@/lib/practice/attribution'

/** Keep pronunciation-adjacent claims opt-in until the evaluator is validated. */
export const pronunciationEvidenceCopyEnabled =
  process.env.NEXT_PUBLIC_PRONUNCIATION_EVIDENCE_COPY === 'true'

export function evidenceCopyForModality(
  modality: EvidenceModality,
  enabled = pronunciationEvidenceCopyEnabled,
): string {
  if (modality === 'stt_intelligibility' && enabled) return 'Inteligible en STT'
  if (modality === 'spoken_production' && enabled) return 'Producción hablada'
  return 'Evidencia objetiva'
}

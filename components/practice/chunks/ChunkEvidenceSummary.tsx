// Planned structure:
// <ChunkEvidenceSummary>
//   <EvidenceStatus /> — wording backed only by observed modality-days
//   <PronunciationEvidenceNote /> — intelligibility signal, not acoustic accuracy
// </ChunkEvidenceSummary>

import type { ChunkEvidenceRecord } from '@/lib/db'
import { deriveChunkEvidenceReadiness } from '@/lib/chunk-of-day/evidence'

interface Props {
  evidence?: ChunkEvidenceRecord
}

export function ChunkEvidenceSummary({ evidence }: Props) {
  const readiness = deriveChunkEvidenceReadiness(evidence)
  const pronunciationNote = readiness.pronunciationDays > 0
    ? <p className="text-caption text-fg-muted">Inteligibilidad observada en {readiness.pronunciationDays} día{readiness.pronunciationDays === 1 ? '' : 's'}; no equivale a un análisis acústico.</p>
    : null

  if (readiness.canSayCanUse) {
    return <div className="mt-2 space-y-1">
      <p className="text-caption font-medium text-success">Puedes usar este chunk: uso observado en {readiness.useDays} días distintos.</p>
      {pronunciationNote}
    </div>
  }
  if (readiness.useDays > 0) {
    return <div className="mt-2 space-y-1">
      <p className="text-caption text-fg-muted">Uso en práctica: {readiness.useDays} día{readiness.useDays === 1 ? '' : 's'} observado{readiness.useDays === 1 ? '' : 's'}.</p>
      {pronunciationNote}
    </div>
  }
  if (readiness.listeningDays > 0) {
    return <div className="mt-2 space-y-1">
      <p className="text-caption text-fg-muted">Escucha reconocida en {readiness.listeningDays} día{readiness.listeningDays === 1 ? '' : 's'}.</p>
      {pronunciationNote}
    </div>
  }
  if (readiness.recognitionDays > 0) {
    return <div className="mt-2 space-y-1">
      <p className="text-caption text-fg-muted">Reconocimiento observado; falta recuperarlo en contexto.</p>
      {pronunciationNote}
    </div>
  }
  return pronunciationNote ? <div className="mt-2">{pronunciationNote}</div> : null
}

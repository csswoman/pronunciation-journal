import { ED_DRILL_CATALOG } from '@/lib/pronunciation/ed-drills/catalog'
import { readClusterProgress } from '@/lib/pronunciation/ed-drills/progress'
import { selectNextItem } from '@/lib/pronunciation/ed-drills/selector'
import type { EdCluster } from '@/lib/pronunciation/ed-drills/types'
import type { DailyStep } from '@/lib/practice/types'

/**
 * Accuracy por debajo de la cual un cluster se considera con evidencia de error.
 * Coincide con el umbral de estabilidad de la escalera (`LADDER_STABILITY_ACCURACY`):
 * si no alcanzas el 80% no desbloqueas el siguiente entorno, así que tampoco
 * deberías haber "salido" del cluster.
 */
export const ED_DRILL_EVIDENCE_ACCURACY = 0.8

/**
 * Intentos mínimos antes de tratar la accuracy como señal. Un único fallo es
 * ruido; exigir 2 evita que un resbalón meta el paso en la diaria del día siguiente.
 */
export const ED_DRILL_EVIDENCE_MIN_ATTEMPTS = 2

export interface EdDrillEvidence {
  cluster: EdCluster
  accuracy: number
  attemptsCount: number
}

/**
 * Primer cluster con evidencia real de error, el de peor accuracy primero.
 * Pura: recibe el progreso ya leído para poder testearse sin Dexie.
 */
export function findEdClusterEvidence(
  progressByCluster: ReadonlyMap<EdCluster, { cluster: EdCluster; accuracy: number; attemptsCount: number }>,
): EdDrillEvidence | null {
  const withEvidence = [...progressByCluster.values()]
    .filter(
      (row) =>
        row.attemptsCount >= ED_DRILL_EVIDENCE_MIN_ATTEMPTS &&
        row.accuracy < ED_DRILL_EVIDENCE_ACCURACY,
    )
    .sort((a, b) => a.accuracy - b.accuracy)

  const worst = withEvidence[0]
  if (!worst) return null
  return { cluster: worst.cluster, accuracy: worst.accuracy, attemptsCount: worst.attemptsCount }
}

/**
 * Paso de escalera de -ed. Devuelve null salvo que exista evidencia de error en
 * algún cluster: es un paso correctivo, no de descubrimiento. Un usuario que
 * nunca ha practicado en `/practice/ed-drills` no tiene evidencia y no lo verá
 * — decisión explícita de producto, no un olvido.
 */
export async function buildEdClusterDrillStep(userId: string): Promise<DailyStep | null> {
  const progressByCluster = await readClusterProgress(userId).catch(() => null)
  if (!progressByCluster || progressByCluster.size === 0) return null

  const evidence = findEdClusterEvidence(progressByCluster)
  if (!evidence) return null

  const item =
    ED_DRILL_CATALOG.find((entry) => entry.cluster === evidence.cluster) ??
    selectNextItem(ED_DRILL_CATALOG, progressByCluster)
  if (!item) return null

  return {
    kind: 'ed_cluster_drill',
    id: `ed_cluster_drill:${evidence.cluster}`,
    title: 'Terminaciones -ed',
    subtitle: `Tu cluster más flojo: /${evidence.cluster}/ · ${item.pastVerb}`,
    icon: 'AudioWaveform',
    exercises: [],
    estMinutes: 3,
    edClusterDrill: {
      cluster: evidence.cluster,
      itemId: item.id,
      accuracy: evidence.accuracy,
    },
  }
}

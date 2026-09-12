'use client'

import { FluencyRadarCard } from '@/components/progress/FluencyRadarCard'
import { useFluencyPreview } from '@/hooks/useFluencyPreview'

interface SkillsRadarPreviewProps {
  enabled: boolean
}

/**
 * Reutiliza el radar de 6 dimensiones de /progress (pedido explícito: "el
 * radar ya existe en progreso"). Solo pide datos para usuarios con fila en
 * Supabase; en modo invitado no hay nada que mostrar y el componente no
 * renderiza, en vez de mostrar un radar vacío sin contexto.
 */
export function SkillsRadarPreview({ enabled }: SkillsRadarPreviewProps) {
  const { preview, isLoading } = useFluencyPreview(enabled)

  if (!enabled || isLoading || !preview?.scores) return null

  return (
    <div className="mb-8">
      <FluencyRadarCard scores={preview.scores} comparisonLabel={preview.comparisonLabel} />
    </div>
  )
}

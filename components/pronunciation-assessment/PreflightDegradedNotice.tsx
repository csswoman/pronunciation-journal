import { BROWSER_BLOCKS_STT_ES } from '@/lib/speech/browser-support-message'
import type { CapabilitySnapshot } from '@/lib/pronunciation/assessment/types'

interface PreflightDegradedNoticeProps {
  snapshot: CapabilitySnapshot | null
}

function degradedReason(snapshot: CapabilitySnapshot | null): string {
  if (!snapshot) return ''
  if (snapshot.browserSupport === 'unsupported') {
    return 'Tu navegador no soporta el reconocimiento de voz necesario.'
  }
  if (snapshot.micPermission === 'denied') {
    return 'No tenemos permiso para usar el micrófono.'
  }
  if (!snapshot.sttAvailable) {
    return 'El servicio de reconocimiento de voz no está disponible ahora mismo (revisa tu conexión).'
  }
  return 'No pudimos confirmar que la evaluación de pronunciación esté disponible.'
}

/**
 * Soft inset notice — not a nested card. Honest about missing production eval.
 */
export function PreflightDegradedNotice({ snapshot }: PreflightDegradedNoticeProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 rounded-md bg-surface-sunken p-3 font-body-sm text-fg-muted">
      <p className="font-label text-fg">No pudimos evaluar tu pronunciación esta vez.</p>
      <p className="text-pretty">{degradedReason(snapshot)}</p>
      <p className="text-pretty">{BROWSER_BLOCKS_STT_ES}</p>
      <p className="text-pretty">
        Puedes continuar con preguntas de percepción y tu propia valoración.
      </p>
    </div>
  )
}

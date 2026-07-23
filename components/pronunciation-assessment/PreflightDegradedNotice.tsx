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
 * Honest, non-blocking notice shown when production (speaking) cannot be
 * evaluated. Never implies that continuing without evaluation counts as
 * measured evidence — it explicitly says evaluation didn't happen.
 */
export function PreflightDegradedNotice({ snapshot }: PreflightDegradedNoticeProps) {
  return (
    <div className="flex flex-col gap-1 rounded-sm border border-[var(--border-default)] bg-[var(--surface-base)] p-3 text-xs text-[var(--text-secondary)]">
      <p className="font-medium text-[var(--text-primary)]">
        No pudimos evaluar tu pronunciación esta vez.
      </p>
      <p>{degradedReason(snapshot)}</p>
      <p>{BROWSER_BLOCKS_STT_ES}</p>
      <p>Puedes continuar con preguntas de percepción y tu propia valoración.</p>
    </div>
  )
}

import { canScoreSpeech } from '@/lib/speech/adapters/webSpeechAdapter'
import { BROWSER_BLOCKS_STT_ES } from '@/lib/speech/browser-support-message'
import type { CapabilitySnapshot } from '@/lib/pronunciation/assessment/types'

interface PreflightDegradedNoticeProps {
  snapshot: CapabilitySnapshot | null
}

function degradedReason(snapshot: CapabilitySnapshot | null): string {
  if (!snapshot) return ''
  if (
    snapshot.browserSupport === 'partial' &&
    typeof window !== 'undefined' &&
    window.isSecureContext === false
  ) {
    return 'Esta dirección no puede usar el micrófono. En el celular abre la app con HTTPS; una dirección http://192.168… no tiene acceso al micrófono.'
  }
  if (typeof window !== 'undefined' && !canScoreSpeech()) {
    return BROWSER_BLOCKS_STT_ES
  }
  if (snapshot.browserSupport === 'unsupported') {
    return 'No encontramos un micrófono disponible en este dispositivo, así que no podemos evaluar la pronunciación aquí.'
  }
  if (snapshot.micPermission === 'denied') {
    return 'El navegador bloqueó el micrófono para este sitio y la página no puede volver a abrir ese aviso. Pulsa el icono junto a la dirección, abre Permisos del sitio y cambia Micrófono a Permitir.'
  }
  if (!snapshot.sttAvailable) {
    return 'El servicio de reconocimiento de voz no está disponible ahora mismo; revisa tu conexión a internet y los permisos de micrófono del sitio.'
  }
  return 'No pudimos confirmar que la evaluación de pronunciación esté disponible.'
}

/**
 * Soft inset notice — not a nested card. Honest about missing production eval.
 */
export function PreflightDegradedNotice({ snapshot }: PreflightDegradedNoticeProps) {
  const permissionDenied = snapshot?.micPermission === 'denied'

  return (
    <div className="flex min-w-0 flex-col gap-1.5 rounded-md bg-surface-sunken p-3 font-body-sm text-fg-muted">
      <p className="font-label text-fg">
        {permissionDenied
          ? 'Activa el micrófono en el navegador'
          : 'No pudimos evaluar tu pronunciación esta vez.'}
      </p>
      <p className="text-pretty">{degradedReason(snapshot)}</p>
      <p className="text-pretty">
        {permissionDenied
          ? 'Al volver a la página detectaremos el cambio automáticamente.'
          : 'Puedes continuar con preguntas de percepción y tu propia valoración; cuando el micrófono esté disponible volveremos a puntuar tu voz.'}
      </p>
    </div>
  )
}

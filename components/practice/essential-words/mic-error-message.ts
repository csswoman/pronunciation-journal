import { STT_NETWORK_FAILURE_ES } from '@/lib/speech/browser-support-message'

/** User-facing Spanish messages for Web Speech / mic failures. */
export function micErrorMessage(error: string | null): string {
  if (!error) return 'No se pudo iniciar el micrófono.'
  if (error === 'not-allowed' || error.includes('Permission')) {
    return 'Permiso de micrófono bloqueado. Actívalo en el candado de la barra de direcciones.'
  }
  if (error === 'no-speech') return 'No se detectó voz. Intenta hablar más cerca del micrófono.'
  if (error === 'audio-capture') return 'No se encontró un micrófono activo en el sistema.'

  const lower = error.toLowerCase()
  if (
    error === 'network' ||
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('abort')
  ) {
    return STT_NETWORK_FAILURE_ES
  }
  if (lower.includes('transcribe failed') || lower.includes('rate limit')) {
    return 'El servicio de transcripción no respondió. Intenta de nuevo en unos segundos.'
  }
  return 'No se pudo iniciar el micrófono.'
}

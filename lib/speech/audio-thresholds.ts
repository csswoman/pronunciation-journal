/**
 * Umbral compartido de audio audible.
 *
 * Antes cada punto de captura usaba su propio número (500 bytes en el hook de
 * reconocimiento, 1000 en el trainer de entonación, ninguno en misiones), así
 * que una grabación vacía se descartaba en silencio en un ejercicio y producía
 * un error distinto en otro. Un único criterio mantiene el mismo mensaje en
 * todos los ejercicios de voz.
 *
 * Un contenedor WebM/Opus sin voz pesa unos pocos cientos de bytes de cabecera;
 * por encima de este umbral ya hay señal suficiente para transcribir.
 */
export const MIN_AUDIBLE_BLOB_BYTES = 600

/** Mensaje único para audio demasiado corto o silencioso. */
export const NO_AUDIO_CAPTURED_MESSAGE =
  'No se detectó audio suficiente. Intenta hablar con más volumen.'

export function hasAudibleAudio(blob: Blob): boolean {
  return blob.size > MIN_AUDIBLE_BLOB_BYTES
}

/**
 * Perfiles de captura de micrófono.
 *
 * La cancelación de eco, la supresión de ruido y el control automático de
 * ganancia mejoran la inteligibilidad para un reconocedor de voz, pero alteran
 * exactamente el espectro y la amplitud que un análisis acústico necesita
 * medir: la supresión de ruido recorta bandas de frecuencia, y el control de
 * ganancia normaliza el volumen, borrando la intensidad real.
 *
 * Por eso hay dos perfiles. Elegir el equivocado no rompe nada de forma
 * visible: simplemente produce formantes medidos sobre una señal ya procesada,
 * es decir, medidas que no describen lo que el alumno dijo.
 *
 * El evaluador acústico sigue deshabilitado a propósito (ver
 * UNAVAILABLE_EVIDENCE_CAPABILITIES y el plan 071); este perfil existe para
 * que, cuando se active, no herede por descuido el perfil de inteligibilidad.
 */

/** Frecuencia de muestreo mínima para resolver formantes vocálicos. */
export const ACOUSTIC_SAMPLE_RATE = 44100

/**
 * Perfil por defecto: transcripción y puntuación por inteligibilidad.
 * Los filtros ayudan porque sólo importa que las palabras se entiendan.
 */
export const INTELLIGIBILITY_CAPTURE: MediaStreamConstraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
}

/**
 * Perfil para análisis acústico (formantes, duración vocálica, entonación).
 * Desactiva todo procesado y fija la frecuencia de muestreo: la señal debe
 * llegar tan cruda como el navegador permita.
 */
export const ACOUSTIC_CAPTURE: MediaStreamConstraints = {
  audio: {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
    sampleRate: ACOUSTIC_SAMPLE_RATE,
    channelCount: 1,
  },
}

export type CaptureProfile = 'intelligibility' | 'acoustic'

export function captureConstraints(profile: CaptureProfile): MediaStreamConstraints {
  return profile === 'acoustic' ? ACOUSTIC_CAPTURE : INTELLIGIBILITY_CAPTURE
}

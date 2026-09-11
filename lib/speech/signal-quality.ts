/**
 * Detección de captura silenciosa.
 *
 * El tamaño del blob (ver `audio-thresholds.ts`) sólo prueba que el grabador
 * escribió bytes, no que el micrófono oyera voz: un micro silenciado o un
 * ventilador de fondo producen un contenedor de tamaño normal. El pico de
 * amplitud sí distingue una grabación con habla de una sin ella, y el
 * analizador que alimenta el osciloscopio (`useVoiceLevel`) ya lo calcula.
 *
 * Sirve para dar el mensaje correcto ("no te escuchamos") en lugar de mandar
 * silencio al reconocedor y presentar su transcripción vacía como un fallo de
 * pronunciación del alumno.
 */

/**
 * Pico de amplitud normalizado (0-1) por debajo del cual la grabación no
 * contiene voz, sólo ruido de fondo y el suelo de ruido del micrófono.
 */
export const SILENCE_PEAK_THRESHOLD = 0.08

export interface PeakTracker {
  /** Registra una muestra de amplitud normalizada (0-1). */
  observe: (sample: number) => void
  /** Mayor amplitud vista desde el último reset. */
  peak: () => number
  reset: () => void
}

/** True cuando la grabación nunca superó el suelo de ruido. */
export function isSilentCapture(peak: number): boolean {
  return peak < SILENCE_PEAK_THRESHOLD
}

export function trackPeak(): PeakTracker {
  let maxSeen = 0

  return {
    observe(sample: number) {
      // Una muestra corrupta no debe declarar audible una grabación muda.
      if (!Number.isFinite(sample) || sample < 0 || sample > 1) return
      if (sample > maxSeen) maxSeen = sample
    },
    peak: () => maxSeen,
    reset() {
      maxSeen = 0
    },
  }
}

/** Punto medio del rango de datos de dominio temporal: silencio absoluto. */
const SILENCE_BYTE = 128

/**
 * Conecta un analizador de Web Audio al stream y alimenta `tracker` con el
 * pico de amplitud en cada frame. Devuelve la función de limpieza, o null si
 * el navegador no expone Web Audio (entonces simplemente no hay detección de
 * silencio; la captura sigue funcionando).
 */
export function attachPeakAnalyser(
  stream: MediaStream,
  tracker: PeakTracker
): (() => void) | null {
  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioContextClass) return null

  let rafId: number | null = null
  try {
    const audioCtx = new AudioContextClass()
    const analyser = audioCtx.createAnalyser()
    analyser.fftSize = 2048
    const source = audioCtx.createMediaStreamSource(stream)
    source.connect(analyser)

    const buffer = new Uint8Array(analyser.frequencyBinCount)
    const step = () => {
      analyser.getByteTimeDomainData(buffer)
      let maxDev = 0
      for (let i = 0; i < buffer.length; i++) {
        const dev = Math.abs(buffer[i]! - SILENCE_BYTE)
        if (dev > maxDev) maxDev = dev
      }
      tracker.observe(Math.min(1, maxDev / SILENCE_BYTE))
      rafId = requestAnimationFrame(step)
    }
    rafId = requestAnimationFrame(step)

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId)
      source.disconnect()
      analyser.disconnect()
      void audioCtx.close()
    }
  } catch {
    if (rafId !== null) cancelAnimationFrame(rafId)
    return null
  }
}

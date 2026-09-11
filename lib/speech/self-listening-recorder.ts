"use client";

import { hasAudibleAudio } from './audio-thresholds'

export interface RecorderHandlers {
  /** Recibe la URL del audio grabado, sólo si contuvo señal audible. */
  onAudioUrl: (url: string) => void
  /** Se invoca al terminar, para que el llamador libere el stream si procede. */
  onStopped: () => void
}

/**
 * Crea y arranca un MediaRecorder para auto-escucha del alumno.
 *
 * Devuelve null si el navegador no puede grabar; el llamador decide qué hacer
 * (aquí eso significa no dejar el micrófono abierto).
 */
export function startSelfListeningRecorder(
  stream: MediaStream,
  handlers: RecorderHandlers
): MediaRecorder | null {
  if (typeof window === 'undefined' || typeof window.MediaRecorder === 'undefined') {
    return null
  }

  const chunks: Blob[] = []
  try {
    const recorder = new MediaRecorder(stream)

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' })
      if (hasAudibleAudio(blob)) {
        handlers.onAudioUrl(URL.createObjectURL(blob))
      }
      handlers.onStopped()
    }

    // timeslice corto: una parada anómala conserva el audio ya capturado.
    recorder.start(50)
    return recorder
  } catch {
    return null
  }
}

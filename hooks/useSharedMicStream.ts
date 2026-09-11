"use client";

import { useRef, useCallback, useEffect } from "react";
import { INTELLIGIBILITY_CAPTURE } from "@/lib/speech/capture-profiles";

/** Un stream cacheado sólo sirve si sus tracks siguen vivos. */
function isStreamLive(stream: MediaStream): boolean {
  const tracks = stream.getTracks();
  return tracks.length > 0 && tracks.every((t) => t.readyState === "live");
}

export function useSharedMicStream() {
  const streamRef = useRef<MediaStream | null>(null);
  // Dos llamadas simultáneas (p. ej. grabador + analizador) deben compartir una
  // sola petición de permiso en vez de abrir dos prompts y dos streams.
  const pendingRef = useRef<Promise<MediaStream> | null>(null);

  const release = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    pendingRef.current = null;
  }, []);

  const getStream = useCallback(async (): Promise<MediaStream> => {
    const cached = streamRef.current;
    if (cached) {
      if (isStreamLive(cached)) return cached;
      // El usuario revocó el permiso o el SO soltó el dispositivo: los tracks
      // quedan 'ended' y seguirían entregando grabaciones vacías en silencio.
      cached.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (pendingRef.current) return pendingRef.current;

    const request = navigator.mediaDevices
      .getUserMedia(INTELLIGIBILITY_CAPTURE)
      .then((stream) => {
        streamRef.current = stream;
        return stream;
      })
      .finally(() => {
        // Un fallo no debe cachearse: el siguiente intento vuelve a pedir permiso.
        pendingRef.current = null;
      });

    pendingRef.current = request;
    return request;
  }, []);

  // Nunca dejar el micrófono abierto si el componente desaparece sin liberar.
  useEffect(() => release, [release]);

  return { getStream, release };
}

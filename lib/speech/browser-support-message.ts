/**
 * Shared copy when the browser blocks Web Speech's remote recognition
 * (Brave, Opera, Edge, Arc, Firefox, …). The API often exists on `window`, so
 * feature detection passes, but attempts fail with a `network` error.
 *
 * Honest product line: Google Chrome has the speech backend key. Other
 * Chromium browsers report "Chrome/" in the UA but usually cannot score
 * pronunciation via Web Speech.
 * Do not inline these strings in components — import from here.
 */

/** Named list reused in Spanish tips (keep short enough for UI). */
export const NON_CHROME_BROWSERS_ES = "Brave, Opera, Edge, Arc o Firefox"

/** Quiet tip for login / first entry (always-safe Spanish). */
export const CHROME_MIC_TIP_ES =
  `Para practicar con micrófono y puntuación de pronunciación, la mejor experiencia es Google Chrome. En ${NON_CHROME_BROWSERS_ES} — y navegadores similares — el reconocimiento de voz suele estar bloqueado.`

/** Spanish, inline error line (e.g. under a mic button). */
export const BROWSER_BLOCKS_STT_ES =
  `El reconocimiento de voz para puntuar pronunciación funciona de forma fiable en Google Chrome. En ${NON_CHROME_BROWSERS_ES} suele fallar aunque el micrófono esté permitido.`

/** Spanish, network-failure message including the "if you're on Chrome" hint. */
export const STT_NETWORK_FAILURE_ES =
  `No se pudo usar el reconocimiento de voz. Suele fallar fuera de Google Chrome (p. ej. ${NON_CHROME_BROWSERS_ES}). Si ya estás en Chrome, revisa tu conexión a internet.`

/** Spanish, dismissible in-app banner when the current browser is unreliable. */
export const CHROME_MIC_BANNER_TITLE_ES = "Mejor con Google Chrome"

export const CHROME_MIC_BANNER_BODY_ES =
  `Puedes explorar la app aquí. Para ejercicios con micrófono y puntuación, ábrela en Google Chrome. En ${NON_CHROME_BROWSERS_ES} el reconocimiento de voz del navegador suele estar bloqueado.`

/** English, shadowing-fallback message for scored exercises. */
export const BROWSER_BLOCKS_SCORING_EN =
  "This browser (like Brave, Opera, Edge, or Firefox) blocks voice scoring, so we can't rate your pronunciation. You can listen and repeat here, but for scored pronunciation practice, open the app in Google Chrome."

/** English, shadowing-fallback message tuned for shadow-phrase exercises. */
export const BROWSER_BLOCKS_SCORING_SHADOW_EN =
  "This browser (like Brave, Opera, Edge, or Firefox) blocks voice scoring. Listen and repeat to shadow the phrase, but for scored pronunciation practice, open the app in Google Chrome."

/** localStorage key — ephemeral UI pref, not learning data. */
export const CHROME_MIC_TIP_DISMISSED_KEY = "speech:chrome-mic-tip-dismissed"

export function readChromeMicTipDismissed(): boolean {
  if (typeof window === "undefined") return false
  try {
    return window.localStorage.getItem(CHROME_MIC_TIP_DISMISSED_KEY) === "1"
  } catch {
    return false
  }
}

export function dismissChromeMicTip(): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(CHROME_MIC_TIP_DISMISSED_KEY, "1")
  } catch {
    /* quota / private mode */
  }
}

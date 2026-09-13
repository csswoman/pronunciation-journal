/**
 * Shared copy for microphone / voice-scoring degradation.
 *
 * What is actually true: pronunciation scoring does NOT require Google Chrome.
 * Browsers without a reliable native recognizer — Firefox, Safari, Brave, Edge,
 * Arc, and every phone — are routed to the Gemini adapter, which records the
 * audio locally and transcribes it server side. See `detectSpeechAdapterKind`.
 *
 * So scoring becomes unavailable for reasons that are NOT the browser brand:
 * an insecure origin (http:// on a LAN address), a blocked or missing
 * microphone, or being offline. Copy here must name those causes. Telling a
 * Firefox or Safari learner to install Chrome is false, and it does not fix a
 * blocked microphone either.
 *
 * Do not inline these strings in components — import from here.
 */

/** Spanish, inline error line (e.g. under a mic button). */
export const BROWSER_BLOCKS_STT_ES =
  "No podemos usar el micrófono en este momento. Revisa que la app esté abierta con https://, que el micrófono tenga permiso y que tengas conexión a internet."

/** Spanish, network-failure message. Scoring needs the network, not a brand. */
export const STT_NETWORK_FAILURE_ES =
  "No se pudo completar el reconocimiento de voz. La transcripción necesita conexión a internet: revísala y vuelve a intentarlo."

/** Spanish, notice when the microphone itself is unreachable. */
export const MIC_UNAVAILABLE_TITLE_ES = "Micrófono no disponible"

export const MIC_UNAVAILABLE_BODY_ES =
  "Puedes usar el resto de la app con normalidad. Para los ejercicios con voz necesitamos un micrófono: ábrela con https://, permite el micrófono en el navegador y comprueba que el dispositivo tenga uno disponible."

/** English, shadowing-fallback message for scored exercises. */
export const SCORING_UNAVAILABLE_EN =
  "We can't reach your microphone, so this attempt can't be scored. Listen to the model and repeat it out loud — this attempt won't count for or against you."

export const SCORING_UNAVAILABLE_ES =
  "No podemos acceder a tu micrófono, así que este intento no se puede puntuar. Escucha el modelo y repite la palabra en voz alta; este intento no contará ni a favor ni en contra."

/** English, shadowing-fallback message tuned for shadow-phrase exercises. */
export const SCORING_UNAVAILABLE_SHADOW_EN =
  "We can't reach your microphone, so this attempt can't be scored. Listen and repeat to shadow the phrase — this attempt won't count for or against you."

export const SCORING_UNAVAILABLE_SHADOW_ES =
  "No podemos acceder a tu micrófono, así que este intento no se puede puntuar. Escucha e imita la frase en voz alta; este intento no contará ni a favor ni en contra."

/** localStorage key — ephemeral UI pref, not learning data. */
export const MIC_TIP_DISMISSED_KEY = "speech:mic-unavailable-tip-dismissed"

export function readMicTipDismissed(): boolean {
  if (typeof window === "undefined") return false
  try {
    return window.localStorage.getItem(MIC_TIP_DISMISSED_KEY) === "1"
  } catch {
    return false
  }
}

export function dismissMicTip(): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(MIC_TIP_DISMISSED_KEY, "1")
  } catch {
    /* quota / private mode */
  }
}

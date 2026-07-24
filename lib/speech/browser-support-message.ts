/**
 * Shared copy for the case where the browser (Brave, Firefox, …) blocks the
 * Web Speech API's remote recognition service — the API exists on `window`, so
 * feature detection passes, but every attempt fails with a `network` error.
 *
 * Centralized so every mic surface tells the user the same honest thing:
 * voice scoring can't happen here, and Chrome/Edge is the way to get it.
 * Do not inline these strings in components — import from here.
 */

/** Spanish, inline error line (e.g. under a mic button). */
export const BROWSER_BLOCKS_STT_ES =
  'El reconocimiento de voz suele fallar en navegadores como Brave o Firefox. Para grabar tu pronunciación, abre la app en Google Chrome o Microsoft Edge.'

/** Spanish, network-failure message including the "if you're on Chrome" hint. */
export const STT_NETWORK_FAILURE_ES =
  'No se pudo usar el reconocimiento de voz. Suele fallar en navegadores como Brave o Firefox; prueba en Google Chrome o Microsoft Edge. Si ya estás en Chrome, revisa tu conexión a internet.'

/** English, shadowing-fallback message for scored exercises. */
export const BROWSER_BLOCKS_SCORING_EN =
  "This browser (like Brave or Firefox) blocks voice scoring, so we can't rate your pronunciation. You can listen and repeat here, but to actually practice pronunciation with scoring, open the app in Google Chrome or Microsoft Edge."

/** English, shadowing-fallback message tuned for shadow-phrase exercises. */
export const BROWSER_BLOCKS_SCORING_SHADOW_EN =
  'This browser (like Brave or Firefox) blocks voice scoring. Listen and repeat to shadow the phrase, but for scored pronunciation practice, open the app in Google Chrome or Microsoft Edge.'

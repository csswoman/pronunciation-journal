/**
 * Puente entre la anotación humana de L2-ARCTIC y la salida del evaluador CTC:
 * produce los ensayos que alimentan la puerta de decisión del plan 038.
 * Node-only, para el benchmark; no se despliega en la app.
 */
import {
  assessRecognizedPhonemes,
  type RecognizedPhoneme,
} from '../phoneme-ctc-evaluator'
import type { AnnotatedPhone, L2ArcticUtterance } from './l2arctic-loader'
import type { PhonemeTrial } from './phoneme-ctc-metrics'

/** Un error humano es una sustitución o una omisión. Las adiciones no tienen fonema esperado. */
function isHumanError(phone: AnnotatedPhone): boolean {
  return phone.error === 'substitution' || phone.error === 'deletion'
}

/**
 * Ensayos de un enunciado. El esperado son las etiquetas **canónicas** de la
 * anotación (mejor verdad de referencia que CMUdict, que no sabe qué leyó de
 * verdad el hablante). Las adiciones se excluyen: no hay fonema esperado que
 * juzgar, y el evaluador ya las reporta aparte.
 *
 * Se abstiene, sin contar ni a favor ni en contra, cuando el anotador no pudo
 * juzgar el fonema percibido (`err`) o cuando el modelo emitió un token fuera
 * del inventario del inglés.
 */
export function buildPhonemeTrials(
  utterance: L2ArcticUtterance,
  recognized: RecognizedPhoneme[],
  evaluatorVersion: string,
): PhonemeTrial[] {
  const expectedPhones = utterance.phones.filter((p) => p.canonical !== null)
  const expected = expectedPhones.map((p) => p.canonical as string)
  const assessment = assessRecognizedPhonemes(expected, recognized, evaluatorVersion)

  return expectedPhones.map((phone, i) => {
    const verdict = assessment.phonemes[i]
    return {
      expected: phone.canonical as string,
      modelFlagged: verdict ? verdict.verdict !== 'match' : false,
      humanFlagged: isHumanError(phone),
      abstained: phone.perceivedUncertain || (verdict?.abstained ?? false),
    }
  })
}

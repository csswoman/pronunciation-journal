import {
  IMMERSION_ENRICH_SYSTEM_PROMPT,
  buildImmersionEnrichUserPrompt,
} from '@/lib/ai-prompts'
import {
  isRetryableEnrichmentError,
  parseImmersionEnrichment,
  type ImmersionEnrichment,
  type ImmersionLessonSeed,
} from '@/lib/immersion/enrich'
import { callWithFallback, shouldTryNextModel } from './client'

function shouldRetry(err: unknown): boolean {
  return isRetryableEnrichmentError(err) || shouldTryNextModel(err)
}

/**
 * Enriquece una lección de inmersión con vocabulario, frases y quiz reales.
 * Usa la cadena de fallback compartida; un modelo que devuelva JSON inválido
 * o contenido de plantilla cede el turno al siguiente.
 */
export async function enrichImmersionLesson(
  apiKey: string,
  seed: ImmersionLessonSeed,
): Promise<ImmersionEnrichment> {
  return callWithFallback(
    apiKey,
    {
      contents: buildImmersionEnrichUserPrompt(seed),
      config: {
        systemInstruction: IMMERSION_ENRICH_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        temperature: 0.5,
        maxOutputTokens: 2048,
      },
    },
    parseImmersionEnrichment,
    { shouldRetry },
  )
}

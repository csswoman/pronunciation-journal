'use client'

// Planned structure:
// <PhonemeDifficultyHeadword>  — una línea: "Fíjate en f[a]vorite" + /eɪ/
//   <PhoneticWordHighlight />  — existente: parte la palabra y resalta la grafía
// </PhonemeDifficultyHeadword>

import { PhoneticWordHighlight } from '@/components/pronunciation/PhoneticWordHighlight'
import { pickPrimaryFix } from '@/lib/pronunciation/pick-primary-fix'
import type { WordResult } from '@/lib/types'

interface Props {
  wordResults: WordResult[]
}

/**
 * Señala en la grafía de la palabra dónde está el sonido con posible dificultad.
 *
 * Una sola dificultad por intento (`pickPrimaryFix`): marcar cinco sonidos a la
 * vez no orienta. No afirma que el sonido esté mal — la señal es el texto
 * reconocido, no el audio; ver `PhonemeFeedbackTable`.
 */
export function PhonemeDifficultyHeadword({ wordResults }: Props) {
  // Sin mapa de sílabas: aquí basta el fallback a la palabra completa.
  const fix = pickPrimaryFix(wordResults, new Map())
  const ipa = fix?.culprit.ipa
  if (!fix || !ipa || !fix.syllableText) return null

  return (
    <p className="m-0 flex flex-wrap items-baseline justify-center gap-2 text-center text-body">
      <span className="text-fg-muted">Fíjate en</span>
      <PhoneticWordHighlight
        word={fix.syllableText}
        phonemeOrIpa={ipa}
        className="text-body-lg font-semibold text-fg"
      />
      <span className="font-ipa text-body-sm text-fg-muted">{`/${ipa}/`}</span>
    </p>
  )
}

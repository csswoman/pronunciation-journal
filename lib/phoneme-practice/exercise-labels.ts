import type { ExerciseSlug } from '@/lib/practice/types'
import { PHONEME_CONFUSION } from '@/lib/phoneme-practice/phoneme-similarity'

function primaryContrast(ipa: string): string | undefined {
  return PHONEME_CONFUSION[ipa]?.[0]
}

export type PhonemeExerciseMeta = {
  eyebrow: string
  title?: string
}

export function getPhonemeExerciseMeta(
  slug: ExerciseSlug,
  ctx: { ipa?: string; targetWord?: string; contrastIpa?: string },
): PhonemeExerciseMeta {
  const contrast = ctx.contrastIpa ?? (ctx.ipa ? primaryContrast(ctx.ipa) : undefined)

  switch (slug) {
    case 'pick_word':
      return {
        eyebrow: contrast && ctx.ipa
          ? `Distingue ${ctx.ipa} de ${contrast}`
          : 'Elige las opciones correctas',
        title: ctx.ipa
          ? `¿Qué palabras contienen el sonido ${ctx.ipa}?`
          : '¿Qué palabras contienen este sonido?',
      }
    case 'pick_sound':
      return {
        eyebrow: contrast && ctx.ipa
          ? `Distingue ${ctx.ipa} de ${contrast}`
          : 'Elige la opción correcta',
        title: '¿Qué sonido tiene esta palabra?',
      }
    case 'minimal_pair':
      return {
        eyebrow: contrast && ctx.ipa
          ? `Distingue ${ctx.ipa} de ${contrast}`
          : 'Elige la palabra correcta',
        title: ctx.ipa ? `¿Cuál contiene ${ctx.ipa}?` : '¿Cuál palabra tiene el sonido objetivo?',
      }
    case 'dictation':
      return {
        eyebrow: 'Escucha y escribe lo que oyes',
      }
    case 'speak_word':
      return {
        eyebrow: 'Pronuncia en voz alta',
      }
    case 'reorder_words':
      return {
        eyebrow: 'Ordena la frase',
      }
    default:
      return { eyebrow: 'Practica el sonido' }
  }
}

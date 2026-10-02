import type { WordFeedbackState } from '@/lib/pronunciation/feedback/word-feedback'

/**
 * Pastel de contenido por estado (menta · mantequilla · coral). Todo lo que
 * va sobre pastel usa `ink*`, así se lee igual con cualquier acento y tema.
 */
interface WordTone {
  /** Etiqueta visible (leyenda, badge). */
  label: string
  /** Fondo pastel de chip / botón / badge. */
  fill: string
  /** Hover del botón relleno. */
  fillHover: string
  /** Punto de la leyenda. */
  dot: string
  /** Corchete izquierdo de la tarjeta de diagnóstico. */
  bracket: string
}

export const WORD_TONE: Record<WordFeedbackState, WordTone> = {
  good: {
    label: 'Bien',
    fill: 'bg-mint',
    fillHover: 'hover:bg-mint-deep',
    dot: 'bg-mint-deep',
    bracket: 'border-mint-deep',
  },
  almost: {
    label: 'Casi',
    fill: 'bg-butter',
    fillHover: 'hover:bg-butter-deep',
    dot: 'bg-butter-deep',
    bracket: 'border-butter-deep',
  },
  bad: {
    label: 'No se oyó',
    fill: 'bg-coral',
    fillHover: 'hover:bg-coral-deep',
    dot: 'bg-coral-deep',
    bracket: 'border-coral-deep',
  },
}

export const WORD_TONE_ORDER: WordFeedbackState[] = ['good', 'almost', 'bad']

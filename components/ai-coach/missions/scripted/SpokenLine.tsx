'use client'

// Planned structure:
// <SpokenLine>
//   <Word /> — un span por palabra, resaltado si es la que suena

import { cn } from '@/lib/cn'
import { splitSpokenWords } from '@/lib/speech/word-timings'

interface Props {
  text: string
  /** Indice de la palabra que suena ahora, o null si no suena nada. */
  activeIndex: number | null
}

/**
 * La linea del coach, palabra a palabra, con la actual resaltada.
 *
 * Seguir el texto mientras se escucha es justo lo que se practica aqui: la
 * frase tiene que seguir leyendose como una frase, asi que el resaltado usa
 * fondo y peso, nunca reflow (nada de cambiar tamano o fuente).
 */
export function SpokenLine({ text, activeIndex }: Props) {
  const words = splitSpokenWords(text)

  return (
    <span data-testid="spoken-script-line" className="inline">
      {words.map((word, index) => {
        const isActive = activeIndex === index
        return (
          <span key={`${word}-${index}`}>
            <span
              data-active={isActive ? 'true' : 'false'}
              className={cn(
                'rounded-sm transition-colors duration-(--transition-fast) motion-reduce:transition-none',
                isActive && 'bg-primary-soft px-0.5 font-semibold text-fg',
              )}
            >
              {word}
            </span>
            {index < words.length - 1 ? ' ' : null}
          </span>
        )
      })}
    </span>
  )
}

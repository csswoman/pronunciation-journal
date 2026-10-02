'use client'

// Planned structure:
// <SentenceListenButtons>
//   <ListenButton> Escuchar frase
//   <ListenButton> Más lento

import { ListenButton } from '@/components/ui/ListenButton'
import { speak } from '@/lib/phoneme-practice/tts'

interface Props {
  sentence: string
}

export function SentenceListenButtons({ sentence }: Props) {
  if (!sentence) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ListenButton onPlay={() => speak(sentence)} label="Escuchar frase" />
      <ListenButton onPlay={() => speak(sentence, { rate: 0.6 })} label="Más lento" />
    </div>
  )
}

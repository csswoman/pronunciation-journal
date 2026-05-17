'use client'

import { Play, Heart } from 'lucide-react'

interface Props {
  word: string
  ipa: string
  sentence: string
  sentenceHighlight: string
  isFav: boolean
  onListen: () => void
  onToggleFav: () => void
}

export default function LessonWordPanel({
  word, ipa, sentence, sentenceHighlight, isFav, onListen, onToggleFav,
}: Props) {
  const parts = sentence.split(new RegExp(`(${sentenceHighlight})`, 'i'))

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-heading font-bold leading-none text-[clamp(4rem,8vw,7rem)] text-fg">
        {word}
      </h1>

      <p className="font-ipa text-2xl">{ipa}</p>

      <p className="text-base italic leading-relaxed text-fg-muted">
        {parts.map((part, i) =>
          part.toLowerCase() === sentenceHighlight.toLowerCase()
            ? <strong key={i} className="not-italic font-semibold text-fg">{part}</strong>
            : part
        )}
      </p>

      <div className="flex items-center gap-3 mt-1">
        <button
          type="button"
          onClick={onListen}
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white bg-gradient-primary cursor-pointer"
        >
          <Play size={13} fill="white" />
          Listen
        </button>
        <button
          type="button"
          onClick={onToggleFav}
          className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium border border-border-subtle bg-transparent cursor-pointer transition-colors ${
            isFav ? 'text-primary' : 'text-fg-muted'
          }`}
        >
          <Heart size={13} fill={isFav ? 'currentColor' : 'none'} />
          Save
        </button>
      </div>
    </div>
  )
}

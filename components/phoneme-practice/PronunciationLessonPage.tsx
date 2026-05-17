'use client'

import { useState } from 'react'
import { ArrowLeft, Volume2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import LessonWordPanel from './LessonWordPanel'
import LessonRecordPanel from './LessonRecordPanel'
import { speak } from '@/lib/phoneme-practice/tts'

interface LessonWord {
  word: string
  ipa: string
  sentence: string
  sentenceHighlight: string
}

interface Props {
  phoneme?: string
  words?: LessonWord[]
}

const MOCK_WORDS: LessonWord[] = [
  { word: 'make', ipa: '/meɪk/', sentence: "Let's make a plan together.", sentenceHighlight: 'make' },
  { word: 'day',  ipa: '/deɪ/',  sentence: 'It was a beautiful day.',     sentenceHighlight: 'day'  },
  { word: 'rain', ipa: '/reɪn/', sentence: 'The rain fell softly.',        sentenceHighlight: 'rain' },
  { word: 'take', ipa: '/teɪk/', sentence: 'Please take your time.',       sentenceHighlight: 'take' },
  { word: 'say',  ipa: '/seɪ/',  sentence: 'What did she say to you?',     sentenceHighlight: 'say'  },
  { word: 'play', ipa: '/pleɪ/', sentence: 'Kids love to play outside.',   sentenceHighlight: 'play' },
]

export default function PronunciationLessonPage({ phoneme = '/eɪ/', words = MOCK_WORDS }: Props) {
  const router = useRouter()
  const [index, setIndex] = useState(0)
  const [isFav, setIsFav] = useState(false)
  const [isRecording, setIsRecording] = useState(false)

  const current = words[index]
  const total = words.length

  function handleListen() { speak(current.word) }
  function advance() { if (index < total - 1) setIndex(i => i + 1) }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-surface-base">
      <header className="flex items-center justify-between px-10 py-5 shrink-0 border-b border-border-subtle">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-1 text-fg-subtle bg-transparent border-0 cursor-pointer transition-colors"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="text-center">
          <div
            className="font-bold leading-none text-3xl text-primary"
            style={{ fontFamily: 'var(--font-phoneme), serif' }}
          >
            {phoneme}
          </div>
          <p className="text-xs mt-1 text-fg-subtle">{index + 1} / {total}</p>
        </div>

        <button
          type="button"
          onClick={handleListen}
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold tracking-wider uppercase bg-surface-raised border border-border-subtle text-fg cursor-pointer transition-colors"
        >
          <Volume2 size={13} />
          Listen &amp; Repeat
        </button>
      </header>

      <main className="flex flex-1 min-h-0 gap-12 px-16 py-8 mx-auto w-full max-w-5xl items-center">
        <div className="flex-[55] min-w-0">
          <LessonWordPanel
            word={current.word}
            ipa={current.ipa}
            sentence={current.sentence}
            sentenceHighlight={current.sentenceHighlight}
            isFav={isFav}
            onListen={handleListen}
            onToggleFav={() => setIsFav(f => !f)}
          />
        </div>
        <div className="flex-[45] min-w-0 self-stretch py-4">
          <LessonRecordPanel
            isRecording={isRecording}
            onToggleRecord={() => setIsRecording(r => !r)}
          />
        </div>
      </main>

      <footer className="flex items-center justify-between px-10 py-6 shrink-0 border-t border-border-subtle">
        <button
          type="button"
          onClick={advance}
          className="text-sm text-fg-subtle bg-transparent border-0 cursor-pointer transition-colors"
        >
          Skip
        </button>

        <div className="flex items-center gap-1.5">
          {words.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index
                  ? 'w-5 bg-primary'
                  : i < index
                  ? 'w-2 bg-[var(--success)]'
                  : 'w-2 bg-border-subtle'
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={advance}
          className="text-sm text-fg-subtle bg-transparent border-0 cursor-pointer transition-colors"
        >
          I know this →
        </button>
      </footer>
    </div>
  )
}

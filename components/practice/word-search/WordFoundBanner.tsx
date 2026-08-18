'use client'

import React, { useEffect } from 'react'
import type { WordSearchItem } from '@/lib/exercises/word-search/types'
import { Sparkles, X } from '@/components/icons'
import { ListenButton } from '@/components/ui/ListenButton'
import { speakText } from '@/lib/speech/synthesis'

interface Props {
  item: WordSearchItem | null
  onDismiss: () => void
}

export default function WordFoundBanner({ item, onDismiss }: Props) {
  useEffect(() => {
    if (!item) return
    const timer = setTimeout(() => {
      onDismiss()
    }, 6000)
    return () => clearTimeout(timer)
  }, [item, onDismiss])

  if (!item) return null

  return (
    <div
      role="alert"
      className="w-full rounded-xl bg-success-soft border border-success/30 p-3.5 shadow-sm transition-all animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="p-1 rounded-lg bg-success text-on-primary shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-bold text-base text-fg">
                {item.displayWord}
              </span>
              {item.ipa && (
                <span className="font-ipa text-sm text-fg-muted font-medium">
                  {item.ipa}
                </span>
              )}
              {item.meaningEs && (
                <span className="text-xs text-fg-muted">
                  — {item.meaningEs}
                </span>
              )}
            </div>
            {item.exampleSentence && (
              <p className="text-xs text-fg-muted mt-1 italic leading-relaxed">
                &ldquo;{item.exampleSentence}&rdquo;
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <ListenButton onPlay={() => speakText(item.displayWord)} />
          <button
            type="button"
            onClick={onDismiss}
            className="p-1 rounded-md text-fg-subtle hover:text-fg hover:bg-surface-sunken transition-colors cursor-pointer"
            aria-label="Cerrar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Planned structure:
// <NotebookTopicSelector>
//   <CompactRow: current topic label + "Cambiar tema" toggle + ShuffleButton />
//   {expanded && <PillRadioGroup: botones de categoría />}
// </NotebookTopicSelector>

import { useState } from 'react'
import { RefreshCw } from '@/components/icons'
import { cn } from '@/lib/cn'
import { type NotebookTopic } from '@/lib/journal/notebook-types'

interface NotebookTopicSelectorProps {
  selectedTopic: NotebookTopic
  onSelectTopic: (topic: NotebookTopic) => void
  onShuffle: () => void
}

const TOPIC_LABELS: Record<NotebookTopic, string> = {
  daily: 'Tu día',
  opinion: 'Opinión',
  fiction: 'Ficción',
  situational: 'Situaciones',
  vocab: 'Vocabulario',
  free: 'Tema libre',
}

const TOPIC_KEYS: NotebookTopic[] = ['daily', 'opinion', 'fiction', 'situational', 'vocab', 'free']

export function NotebookTopicSelector({
  selectedTopic,
  onSelectTopic,
  onShuffle,
}: NotebookTopicSelectorProps) {
  // Colapsado por defecto: solo el tema activo + "Cambiar tema" son visibles.
  // Evita presentar 6 pills + shuffle antes de que el usuario haya empezado a escribir.
  const [expanded, setExpanded] = useState(false)

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const currentIndex = TOPIC_KEYS.indexOf(selectedTopic)
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      const nextTopic = TOPIC_KEYS[(currentIndex + 1) % TOPIC_KEYS.length]
      onSelectTopic(nextTopic)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      const prevTopic = TOPIC_KEYS[(currentIndex - 1 + TOPIC_KEYS.length) % TOPIC_KEYS.length]
      onSelectTopic(prevTopic)
    }
  }

  if (!expanded) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-primary-soft px-3 py-1 font-caption font-medium text-primary">
          {TOPIC_LABELS[selectedTopic]}
        </span>
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="focus-ring rounded-full px-3 py-1 font-caption font-medium text-fg-muted transition-colors hover:text-fg"
        >
          Cambiar tema
        </button>
        <button
          type="button"
          onClick={onShuffle}
          aria-label="Otra idea"
          title="Otra idea"
          className="focus-ring inline-flex size-7 items-center justify-center rounded-full border border-border-subtle bg-transparent text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
        >
          <RefreshCw size={13} aria-hidden />
        </button>
      </div>
    )
  }

  return (
    <div
      role="radiogroup"
      aria-label="Tema de hoy"
      onKeyDown={handleKeyDown}
      className="flex flex-wrap items-center gap-2"
    >
      {TOPIC_KEYS.map((topicKey) => {
        const isSelected = selectedTopic === topicKey
        return (
          <button
            key={topicKey}
            type="button"
            role="radio"
            aria-checked={isSelected}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => {
              onSelectTopic(topicKey)
              setExpanded(false)
            }}
            className={cn(
              'focus-ring rounded-full px-3 py-1 font-caption font-medium transition-colors',
              isSelected
                ? 'bg-primary-soft text-primary'
                : 'border border-border-subtle bg-transparent text-fg-muted hover:border-border-strong hover:text-fg',
            )}
          >
            {TOPIC_LABELS[topicKey]}
          </button>
        )
      })}

      <button
        type="button"
        onClick={onShuffle}
        aria-label="Otra idea"
        title="Otra idea"
        className="focus-ring inline-flex size-7 items-center justify-center rounded-full border border-border-subtle bg-transparent text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
      >
        <RefreshCw size={13} aria-hidden />
      </button>
    </div>
  )
}

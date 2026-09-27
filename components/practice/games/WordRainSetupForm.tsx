'use client'

// Planned structure:
// <WordRainSetupForm>
//   <SectionHeader title="Nivel de vocabulario" />
//   <CefrLevelSelector levels={CEFR_LEVELS} selected={selectedLevel} onChange={...} />
//   <LevelInfoCard level={selectedLevel} />
//   <ActionRow>
//     <StartButton onClick={handleStart} />
//     <HelperText />
//   </ActionRow>
// </WordRainSetupForm>

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CefrLevel } from '@/lib/essential-words/types'
import { CEFR_LEVELS } from '@/lib/essential-words/types'
import { DIFFICULTY_BY_LEVEL } from '@/lib/exercises/word-rain/types'
import Button from '@/components/ui/Button'
import { ArrowRight } from '@/components/icons'

interface WordRainSetupFormProps {
  onStartGame?: (level: CefrLevel) => void
}

export default function WordRainSetupForm({ onStartGame }: WordRainSetupFormProps) {
  const router = useRouter()
  const [selectedLevel, setSelectedLevel] = useState<CefrLevel>('A2')

  const currentConfig = DIFFICULTY_BY_LEVEL[selectedLevel] ?? DIFFICULTY_BY_LEVEL.A2

  const handleStart = () => {
    if (onStartGame) {
      onStartGame(selectedLevel)
    } else {
      router.push(`/practice/word-rain?level=${selectedLevel}`)
    }
  }

  return (
    <section className="flex flex-col gap-5 rounded-3xl border border-border-default bg-surface-raised p-5 sm:p-6 shadow-xs">
      <div className="flex flex-col gap-1">
        <span className="font-mono text-tiny font-bold uppercase tracking-wider text-fg-muted">
          1 · SELECCIONA EL NIVEL DE VOCABULARIO
        </span>
        <h3 className="font-heading text-xl font-bold text-fg">
          Entrena tu velocidad de lectura y mecanografía
        </h3>
        <p className="font-sans text-body-sm text-fg-muted">
          Las palabras descenderán en la pantalla según tu nivel CEFR seleccionado. Escríbelas antes de que caigan para salvar tus 3 vidas.
        </p>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {CEFR_LEVELS.map((lvl) => {
          const isSelected = selectedLevel === lvl
          return (
            <button
              key={lvl}
              type="button"
              onClick={() => setSelectedLevel(lvl)}
              className={`flex flex-col items-center justify-center py-3 px-2 rounded-2xl border font-heading text-lg font-bold transition-all focus-ring ${
                isSelected
                  ? 'border-[#12151c] bg-[#b9d3fb] text-[#12151c] shadow-xs'
                  : 'border-border-default bg-surface hover:bg-surface-sunken text-fg'
              }`}
            >
              <span>{lvl}</span>
            </button>
          )
        })}
      </div>

      <div className="rounded-2xl bg-surface-sunken p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="font-sans text-body-sm font-bold text-fg">
            Configuración para nivel {selectedLevel}
          </span>
          <span className="font-sans text-caption text-fg-muted">
            {currentConfig.targetWordsToWin} palabras para ganar · {currentConfig.lives} vidas · velocidad adaptativa
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-2">
        <Button
          variant="primary"
          onClick={handleStart}
          className="h-14 px-7 text-base font-bold rounded-full gap-2"
        >
          <span>Comenzar partida</span>
          <ArrowRight size={18} aria-hidden="true" />
        </Button>
        <span className="font-sans text-caption text-fg-muted">
          Las palabras que aciertes se guardan en tu inventario de vocabulario.
        </span>
      </div>
    </section>
  )
}

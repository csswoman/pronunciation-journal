'use client'

// Planned structure:
// <WordSearchSetup>
//   <WordSearchModePicker />        (1 · CÓMO BUSCAR)
//   <WordSearchDifficultyPicker />  (2 · DIFICULTAD)
//   <WordSearchSourceTabs />        (3 · DE DÓNDE SALEN LAS PALABRAS)
//   <ActiveSourcePanel />           (renderizado condicional del panel activo)
// </WordSearchSetup>

import type { WordSearchPuzzle } from '@/lib/exercises/word-search/types'
import { MIN_WORD_SEARCH_ITEMS } from '@/lib/exercises/word-search/grid-generator'
import { useWordSearchSetup } from '@/hooks/useWordSearchSetup'
import WordSearchModePicker from './WordSearchModePicker'
import WordSearchDifficultyPicker from './WordSearchDifficultyPicker'
import WordSearchSourceTabs from './WordSearchSourceTabs'
import WordSearchEssentialPanel from './WordSearchEssentialPanel'
import WordSearchDictionaryPanel from './WordSearchDictionaryPanel'
import WordSearchCuratedPanel from './WordSearchCuratedPanel'
import WordSearchMyWordsPanel from './WordSearchMyWordsPanel'
import WordSearchGeminiPanel from './WordSearchGeminiPanel'

interface Props {
  onStartPuzzle: (puzzle: WordSearchPuzzle) => void
}

export default function WordSearchSetup({ onStartPuzzle }: Props) {
  const setup = useWordSearchSetup(onStartPuzzle)
  const { source, loadingSource, errors } = setup

  return (
    <div className="flex w-full flex-col gap-6">
      <WordSearchModePicker mode={setup.mode} onChange={setup.setMode} />
      <WordSearchDifficultyPicker difficulty={setup.difficulty} onChange={setup.setDifficulty} />

      <hr className="border-border-subtle/60" />

      <section className="flex flex-col gap-4">
        <WordSearchSourceTabs
          activeSource={source}
          onSelect={setup.setSource}
          myWordsCount={setup.myWords.length}
        />

        {source === 'essential' && (
          <WordSearchEssentialPanel
            level={setup.essentialLevel}
            onLevelChange={setup.setEssentialLevel}
            isLoading={loadingSource === 'essential'}
            error={errors.essential ?? null}
            onStart={() => void setup.handleStartEssential()}
          />
        )}

        {source === 'dictionary' && (
          <WordSearchDictionaryPanel
            selectedDictId={setup.selectedDictId}
            onSelectDictId={setup.setSelectedDictId}
            isLoading={loadingSource === 'dictionary'}
            error={errors.dictionary ?? null}
            onStart={() => void setup.handleStartDictionary()}
          />
        )}

        {source === 'curated' && (
          <WordSearchCuratedPanel
            selectedPresetId={setup.selectedPresetId}
            onSelectPresetId={setup.setSelectedPresetId}
            error={errors.curated ?? null}
            onStart={() => void setup.handleStartCurated()}
          />
        )}

        {source === 'word_bank' && (
          <WordSearchMyWordsPanel
            isLoading={setup.isLoadingWords || loadingSource === 'word_bank'}
            myWords={setup.myWords}
            minWordsRequired={MIN_WORD_SEARCH_ITEMS}
            error={errors.word_bank ?? null}
            onStart={() => void setup.handleStartMyWords()}
            onGoToDictionary={() => setup.setSource('essential')}
          />
        )}

        {source === 'gemini' && (
          <WordSearchGeminiPanel
            customTopic={setup.customTopic}
            onCustomTopicChange={setup.setCustomTopic}
            customLevel={setup.customLevel}
            onCustomLevelChange={setup.setCustomLevel}
            isGenerating={loadingSource === 'gemini'}
            error={errors.gemini ?? null}
            onGenerate={() => void setup.handleStartGemini()}
          />
        )}
      </section>
    </div>
  )
}

'use client'

// Planned structure:
// <WordSearchSetup>
//   <WordSearchModePicker />          (selector segmentado de modo 'clues' vs 'classic')
//   <VocabSection>
//     <VocabSectionHeader />          (kicker explicativo y conteo de palabras)
//     <WordSearchSourceTabs />        (pestañas de origen de vocabulario)
//     <ActiveSourcePanel />           (renderizado condicional del panel activo)
//   </VocabSection>
// </WordSearchSetup>

import type { WordSearchPuzzle } from '@/lib/exercises/word-search/types'
import { MIN_WORD_SEARCH_ITEMS } from '@/lib/exercises/word-search/grid-generator'
import { useWordSearchSetup } from '@/hooks/useWordSearchSetup'
import WordSearchModePicker from './WordSearchModePicker'
import WordSearchSourceTabs from './WordSearchSourceTabs'
import WordSearchDictionaryPanel from './WordSearchDictionaryPanel'
import WordSearchCuratedPanel from './WordSearchCuratedPanel'
import WordSearchMyWordsPanel from './WordSearchMyWordsPanel'
import WordSearchGeminiPanel from './WordSearchGeminiPanel'

interface Props {
  onStartPuzzle: (puzzle: WordSearchPuzzle) => void
}

export default function WordSearchSetup({ onStartPuzzle }: Props) {
  const {
    mode,
    setMode,
    source,
    setSource,
    selectedDictId,
    setSelectedDictId,
    selectedPresetId,
    setSelectedPresetId,
    customTopic,
    setCustomTopic,
    customLevel,
    setCustomLevel,
    myWords,
    isLoadingWords,
    isLoadingDict,
    isGeneratingAi,
    aiError,
    dictError,
    curatedError,
    wordBankError,
    handleStartDictionary,
    handleStartCurated,
    handleStartMyWords,
    handleStartGemini,
  } = useWordSearchSetup(onStartPuzzle)

  return (
    <div className="flex w-full flex-col gap-6">
      <WordSearchModePicker mode={mode} onChange={setMode} />

      <section
        className="flex flex-col gap-3"
        aria-labelledby="word-search-source-heading"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 id="word-search-source-heading" className="font-kicker text-fg-muted">
            2. Origen del vocabulario
          </h2>
          <span className="text-caption text-fg-subtle">8 palabras por tablero</span>
        </div>

        <WordSearchSourceTabs
          activeSource={source}
          onSelect={setSource}
          myWordsCount={myWords.length}
        />

        {source === 'dictionary' && (
          <WordSearchDictionaryPanel
            selectedDictId={selectedDictId}
            onSelectDictId={setSelectedDictId}
            isLoading={isLoadingDict}
            error={dictError}
            onStart={() => void handleStartDictionary()}
          />
        )}

        {source === 'curated' && (
          <WordSearchCuratedPanel
            selectedPresetId={selectedPresetId}
            onSelectPresetId={setSelectedPresetId}
            error={curatedError}
            onStart={handleStartCurated}
          />
        )}

        {source === 'word_bank' && (
          <WordSearchMyWordsPanel
            isLoading={isLoadingWords}
            myWords={myWords}
            minWordsRequired={MIN_WORD_SEARCH_ITEMS}
            error={wordBankError}
            onStart={handleStartMyWords}
            onGoToDictionary={() => setSource('dictionary')}
          />
        )}

        {source === 'gemini' && (
          <WordSearchGeminiPanel
            customTopic={customTopic}
            onCustomTopicChange={setCustomTopic}
            customLevel={customLevel}
            onCustomLevelChange={setCustomLevel}
            isGenerating={isGeneratingAi}
            error={aiError}
            onGenerate={() => void handleStartGemini()}
          />
        )}
      </section>
    </div>
  )
}

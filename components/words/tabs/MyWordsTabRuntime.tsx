"use client";

// Planned structure:
// <MyWordsTabRuntime>
//   <WordsHero />
//   <WordsTab />
//   <WordSelectionBar />
//   <MyWordsTabModals />
// </MyWordsTabRuntime>

import { Plus } from "@/components/icons";
import Section from "@/components/layout/Section";
import Button from "@/components/ui/Button";
import { WordsHero } from "@/components/words/WordsHero";
import { WordsTab } from "@/components/vocabulary/words/WordsTab";
import { WordSelectionBar } from "@/components/vocabulary/words/WordSelectionBar";
import { MyWordsTabModals } from "./MyWordsTabModals";
import { useMyWordsTabRuntime } from "./useMyWordsTabRuntime";

interface MyWordsTabRuntimeProps {
  onMyWordsCountChange?: (count: number) => void;
  onRegisterPrimaryAction?: (action: () => void) => void;
}

export default function MyWordsTabRuntime({
  onMyWordsCountChange,
  onRegisterPrimaryAction,
}: MyWordsTabRuntimeProps) {
  const s = useMyWordsTabRuntime({ onMyWordsCountChange, onRegisterPrimaryAction });

  return (
    <>
      <WordsHero
        activeTab="my-words"
        myWordsCount={s.words.length}
        deckCount={0}
        wordsLoading={s.loading}
      />

      <Section spacing="md">
        <WordsTab
          words={s.words}
          loading={s.loading}
          error={s.error}
          actionError={s.wordActionError}
          wordStats={s.wordStats}
          selectedWordIds={s.selectedWordIds}
          selectMode={s.selectMode}
          onToggleSelectMode={s.handleToggleSelectMode}
          onToggleWordSelection={s.toggleWordSelection}
          onRetry={s.handleRetry}
          onDelete={s.handleDelete}
          onOpenAddWord={(text) => s.openAddWord(text)}
          onToggleFavorite={s.handleToggleFavorite}
          onClearActionError={() => s.setWordActionError(null)}
        />
      </Section>

      <Button
        onClick={() => s.setShowAddWord(true)}
        aria-label="Quick add word"
        onMouseEnter={s.preloadQuickAddModal}
        onFocus={s.preloadQuickAddModal}
        className="fixed bottom-6 right-6 z-40 lg:hidden !rounded-full !p-4 shadow-xl"
        size="icon"
      >
        <Plus size={20} />
      </Button>

      {s.selectMode && s.selectedWordIds.size > 0 && (
        <WordSelectionBar
          count={s.selectedWordIds.size}
          onClear={() => s.setSelectedWordIds(new Set())}
          onCreateDeck={() => s.setShowCreateFromWords(true)}
          onAddToExistingDeck={() => s.setShowAddToExisting(true)}
          onCreateDeckHover={s.preloadCreateDeckFromWordsModal}
          onAddToExistingDeckHover={s.preloadAddToExistingDeckModal}
        />
      )}

      <MyWordsTabModals
        showAddWord={s.showAddWord}
        initialWordText={s.initialWordText}
        showCreateFromWords={s.showCreateFromWords}
        showAddToExisting={s.showAddToExisting}
        selectedWordIds={s.selectedWordIds}
        existingDecks={s.existingDecks}
        onCloseAddWord={() => {
          s.setShowAddWord(false);
          s.setInitialWordText("");
        }}
        onSubmitAddWord={s.handleAddWord}
        onCloseCreateFromWords={() => s.setShowCreateFromWords(false)}
        onCreatedDeck={() => {
          s.setShowCreateFromWords(false);
          s.setSelectedWordIds(new Set());
          s.router.push("/practice/decks");
        }}
        onCloseAddToExisting={() => s.setShowAddToExisting(false)}
        onAddedToExisting={() => {
          s.setShowAddToExisting(false);
          s.setSelectedWordIds(new Set());
        }}
      />
    </>
  );
}

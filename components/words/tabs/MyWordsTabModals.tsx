"use client";

// Planned structure:
// <MyWordsTabModals>
//   <QuickAddModal />
//   <CreateDeckFromWordsModal />
//   <AddToExistingDeckModal />
// </MyWordsTabModals>

import dynamic from "next/dynamic";
import type { DeckListItem } from "@/lib/decks/queries";

const loadQuickAddModal = () => import("@/components/vocabulary/words/QuickAddModal");
const loadCreateDeckFromWordsModal = () =>
  import("@/components/vocabulary/decks/CreateDeckFromWordsModal");
const loadAddToExistingDeckModal = () =>
  import("@/components/vocabulary/decks/AddToExistingDeckModal");

const QuickAddModal = dynamic(() => loadQuickAddModal().then((mod) => mod.QuickAddModal));
const CreateDeckFromWordsModal = dynamic(() =>
  loadCreateDeckFromWordsModal().then((mod) => mod.CreateDeckFromWordsModal),
);
const AddToExistingDeckModal = dynamic(() =>
  loadAddToExistingDeckModal().then((mod) => mod.AddToExistingDeckModal),
);

export {
  loadQuickAddModal,
  loadCreateDeckFromWordsModal,
  loadAddToExistingDeckModal,
};

interface MyWordsTabModalsProps {
  showAddWord: boolean;
  initialWordText: string;
  showCreateFromWords: boolean;
  showAddToExisting: boolean;
  selectedWordIds: Set<string>;
  existingDecks: DeckListItem[];
  onCloseAddWord: () => void;
  onSubmitAddWord: (input: {
    text: string;
    context?: string | null;
    deckId?: string | null;
  }) => Promise<void>;
  onCloseCreateFromWords: () => void;
  onCreatedDeck: () => void;
  onCloseAddToExisting: () => void;
  onAddedToExisting: () => void;
}

export function MyWordsTabModals({
  showAddWord,
  initialWordText,
  showCreateFromWords,
  showAddToExisting,
  selectedWordIds,
  existingDecks,
  onCloseAddWord,
  onSubmitAddWord,
  onCloseCreateFromWords,
  onCreatedDeck,
  onCloseAddToExisting,
  onAddedToExisting,
}: MyWordsTabModalsProps) {
  return (
    <>
      <QuickAddModal
        open={showAddWord}
        onClose={onCloseAddWord}
        onSubmit={onSubmitAddWord}
        initialText={initialWordText}
      />

      {showCreateFromWords && (
        <CreateDeckFromWordsModal
          wordIds={Array.from(selectedWordIds)}
          onClose={onCloseCreateFromWords}
          onCreated={onCreatedDeck}
        />
      )}

      {showAddToExisting && (
        <AddToExistingDeckModal
          wordIds={Array.from(selectedWordIds)}
          decks={existingDecks}
          onClose={onCloseAddToExisting}
          onAdded={onAddedToExisting}
        />
      )}
    </>
  );
}

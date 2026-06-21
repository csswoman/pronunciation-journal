"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

import Section from "@/components/layout/Section";
import Button from "@/components/ui/Button";
import { WordsHero } from "@/components/words/WordsHero";
import { DecksTab } from "@/components/vocabulary/decks/DecksTab";
import { CreateDeckModal } from "@/components/vocabulary/decks/CreateDeckModal";
import { EditDeckModal } from "@/components/vocabulary/decks/EditDeckModal";
import { StudyModal } from "@/components/vocabulary/decks/StudyModal";
import { StudyModalWordBank } from "@/components/vocabulary/decks/StudyModalWordBank";
import { ManageDrawer } from "@/components/vocabulary/decks/ManageDrawer";
import { useAuth } from "@/components/auth/AuthProvider";
import { useDeckData } from "@/hooks/useDeckData";
import { hasWordBankEntries, deleteDeck } from "@/lib/decks/queries";
import { wordBankSource } from "@/lib/decks/study-source";

interface DecksTabRuntimeProps {
  onDeckCountChange: (count: number) => void;
}

export default function DecksTabRuntime({ onDeckCountChange }: DecksTabRuntimeProps) {
  const { user } = useAuth();
  const { decks, counts, loading, addDeck, updateDeck, removeDeck, setWordCount } = useDeckData();
  const [showCreateDeck, setShowCreateDeck] = useState(false);
  const [editDeckId, setEditDeckId] = useState<string | null>(null);
  const [studyDeckId, setStudyDeckId] = useState<string | null>(null);
  const [manageDeckId, setManageDeckId] = useState<string | null>(null);
  const [wordBankStudyDeckId, setWordBankStudyDeckId] = useState<string | null>(null);
  const [deletingDeckId, setDeletingDeckId] = useState<string | null>(null);

  useEffect(() => {
    onDeckCountChange(decks.length);
  }, [decks.length, onDeckCountChange]);

  const editDeck = decks.find((deck) => deck.id === editDeckId) ?? null;
  const studyDeck = decks.find((deck) => deck.id === studyDeckId) ?? null;
  const manageDeck = decks.find((deck) => deck.id === manageDeckId) ?? null;
  const wordBankStudyDeck = decks.find((deck) => deck.id === wordBankStudyDeckId) ?? null;

  const handleStudyDeck = async (deckId: string) => {
    if (!user) return;
    if (await hasWordBankEntries(deckId)) setWordBankStudyDeckId(deckId);
    else setStudyDeckId(deckId);
  };

  const confirmDeleteDeck = async () => {
    if (!deletingDeckId) return;
    try {
      await deleteDeck(deletingDeckId);
      removeDeck(deletingDeckId);
      setDeletingDeckId(null);
      setEditDeckId(null);
    } catch {
      setDeletingDeckId(null);
    }
  };

  if (wordBankStudyDeck && user) {
    return (
      <StudyModalWordBank
        source={wordBankSource({
          deckId: wordBankStudyDeck.id,
          userId: user.id,
          deckLabel: wordBankStudyDeck.name,
        })}
        onClose={() => setWordBankStudyDeckId(null)}
      />
    );
  }

  if (studyDeck) {
    return (
      <>
        <StudyModal deck={studyDeck} onClose={() => setStudyDeckId(null)} />
        {manageDeck && (
          <ManageDrawer
            deck={manageDeck}
            onClose={() => setManageDeckId(null)}
            onWordCountChange={(count) => setWordCount(manageDeckId!, count)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <WordsHero
        activeTab="decks"
        myWordsCount={0}
        deckCount={decks.length}
        lexiconLearned={0}
        lexiconTotal={0}
        wordsLoading={loading}
        onAddWord={() => {}}
        onAddDeck={() => setShowCreateDeck(true)}
      />

      <Section spacing="md">
        <DecksTab
          decks={decks}
          counts={{ ...counts }}
          loading={loading}
          onStudy={handleStudyDeck}
          onManage={setManageDeckId}
          onEdit={setEditDeckId}
          onDelete={setDeletingDeckId}
          onCreateNew={() => setShowCreateDeck(true)}
        />
      </Section>

      <Button
        onClick={() => setShowCreateDeck(true)}
        aria-label="Create deck"
        className="fixed bottom-6 right-6 z-40 lg:hidden !rounded-full !p-4 shadow-xl"
        size="icon"
      >
        <Plus size={20} />
      </Button>

      {showCreateDeck && (
        <CreateDeckModal
          onClose={() => setShowCreateDeck(false)}
          onCreated={(deck) => {
            addDeck(deck);
            setShowCreateDeck(false);
          }}
        />
      )}

      {editDeck && (
        <EditDeckModal
          deck={editDeck}
          onClose={() => setEditDeckId(null)}
          onUpdated={(deck) => {
            updateDeck(deck);
            setEditDeckId(null);
          }}
          onDelete={() => setDeletingDeckId(editDeck.id)}
        />
      )}

      {manageDeck && (
        <ManageDrawer
          deck={manageDeck}
          onClose={() => setManageDeckId(null)}
          onWordCountChange={(count) => setWordCount(manageDeckId!, count)}
        />
      )}

      {deletingDeckId && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 bg-surface-raised border border-border-default rounded-xl shadow-lg text-sm">
          <span className="text-fg-secondary">
            Delete &ldquo;{decks.find((deck) => deck.id === deletingDeckId)?.name}&rdquo;?
          </span>
          <button type="button" className="font-semibold text-error" onClick={confirmDeleteDeck}>
            Delete
          </button>
          <button type="button" className="text-fg-muted" onClick={() => setDeletingDeckId(null)}>
            Cancel
          </button>
        </div>
      )}
    </>
  );
}

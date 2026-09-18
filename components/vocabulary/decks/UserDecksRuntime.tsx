"use client";

import dynamic from "next/dynamic";
import { useCallback, useState, useMemo } from "react";
import { Plus, RotateCcw } from "@/components/icons";
import Button from "@/components/ui/Button";
import { DecksTab } from "@/components/vocabulary/decks/DecksTab";
import { useAuth } from "@/components/auth/AuthProvider";
import { useDeckData } from "@/hooks/useDeckData";
import { hasWordBankEntries, deleteDeck } from "@/lib/decks/queries";
import { wordBankSource } from "@/lib/decks/study-source";

const loadCreateDeckModal = () => import("@/components/vocabulary/decks/CreateDeckModal");
const loadEditDeckModal = () => import("@/components/vocabulary/decks/EditDeckModal");
const loadStudyModal = () => import("@/components/vocabulary/decks/StudyModal");
const loadStudyModalWordBank = () => import("@/components/vocabulary/decks/StudyModalWordBank");
const loadManageDrawer = () => import("@/components/vocabulary/decks/ManageDrawer");

const CreateDeckModal = dynamic(() => loadCreateDeckModal().then((mod) => mod.CreateDeckModal));
const EditDeckModal = dynamic(() => loadEditDeckModal().then((mod) => mod.EditDeckModal));
const StudyModal = dynamic(() => loadStudyModal().then((mod) => mod.StudyModal));
const StudyModalWordBank = dynamic(() => loadStudyModalWordBank().then((mod) => mod.StudyModalWordBank));
const ManageDrawer = dynamic(() => loadManageDrawer().then((mod) => mod.ManageDrawer));

interface UserDecksRuntimeProps {
  courseDecksCount?: number;
}

/** Shared user SRS-deck manager used by the unified Decks hub. */
export function UserDecksRuntime({ courseDecksCount = 314 }: UserDecksRuntimeProps) {
  const { user } = useAuth();
  const { decks, counts, loading, addDeck, updateDeck, removeDeck, setWordCount } = useDeckData();
  const [showCreateDeck, setShowCreateDeck] = useState(false);
  const [editDeckId, setEditDeckId] = useState<string | null>(null);
  const [studyDeckId, setStudyDeckId] = useState<string | null>(null);
  const [manageDeckId, setManageDeckId] = useState<string | null>(null);
  const [wordBankStudyDeckId, setWordBankStudyDeckId] = useState<string | null>(null);
  const [deletingDeckId, setDeletingDeckId] = useState<string | null>(null);

  const preloadCreateDeckModal = useCallback(() => void loadCreateDeckModal(), []);
  const preloadEditDeckModal = useCallback(() => void loadEditDeckModal(), []);
  const preloadStudyDeckModal = useCallback(() => {
    void loadStudyModal();
    void loadStudyModalWordBank();
  }, []);
  const preloadManageDrawer = useCallback(() => void loadManageDrawer(), []);

  const editDeck = decks.find((deck) => deck.id === editDeckId) ?? null;
  const studyDeck = decks.find((deck) => deck.id === studyDeckId) ?? null;
  const manageDeck = decks.find((deck) => deck.id === manageDeckId) ?? null;
  const wordBankStudyDeck = decks.find((deck) => deck.id === wordBankStudyDeckId) ?? null;

  const totalDueWords = useMemo(() => {
    return Object.values(counts.due).reduce((sum, count) => sum + (count || 0), 0);
  }, [counts.due]);

  const handleStudyDeck = async (deckId: string) => {
    if (!user) return;
    if (await hasWordBankEntries(deckId)) setWordBankStudyDeckId(deckId);
    else setStudyDeckId(deckId);
  };

  const handleStudyAllDue = () => {
    const deckWithDue = decks.find((d) => (counts.due[d.id] ?? 0) > 0) || decks[0];
    if (deckWithDue) void handleStudyDeck(deckWithDue.id);
  };

  const confirmDeleteDeck = async () => {
    if (!deletingDeckId) return;
    try {
      await deleteDeck(deletingDeckId);
      removeDeck(deletingDeckId);
      setEditDeckId(null);
    } finally {
      setDeletingDeckId(null);
    }
  };

  if (wordBankStudyDeck && user) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-surface-base text-fg p-4 md:p-6 animate-in fade-in duration-150">
        <StudyModalWordBank
          source={wordBankSource({ deckId: wordBankStudyDeck.id, userId: user.id, deckLabel: wordBankStudyDeck.name })}
          onClose={() => setWordBankStudyDeckId(null)}
        />
      </div>
    );
  }

  if (studyDeck) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-surface-base text-fg p-4 md:p-6 animate-in fade-in duration-150">
        <StudyModal deck={studyDeck} onClose={() => setStudyDeckId(null)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Encabezado Unificado de Tus Mazos */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 id="user-decks-heading" className="font-heading text-h1 font-extrabold text-fg sm:text-4xl">
            Tus mazos
          </h1>
          <p className="font-sans text-body-sm text-fg-muted">
            {decks.length} mazo{decks.length === 1 ? "" : "s"} propio{decks.length === 1 ? "" : "s"} ·{" "}
            {totalDueWords > 0 ? `${totalDueWords} palabra${totalDueWords === 1 ? "" : "s"} para repasar hoy` : "al día"} ·{" "}
            {courseDecksCount} mazos del curso más abajo.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          {totalDueWords > 0 && (
            <Button
              variant="secondary"
              icon={<RotateCcw size={16} />}
              onClick={handleStudyAllDue}
              className="!rounded-full font-bold"
            >
              Repasar los {totalDueWords}
            </Button>
          )}
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => setShowCreateDeck(true)}
            onMouseEnter={preloadCreateDeckModal}
            className="!rounded-full font-bold"
          >
            Nuevo mazo
          </Button>
        </div>
      </div>

      <DecksTab
        decks={decks}
        counts={{ ...counts }}
        loading={loading}
        onStudy={handleStudyDeck}
        onManage={setManageDeckId}
        onEdit={setEditDeckId}
        onDelete={setDeletingDeckId}
        onCreateNew={() => setShowCreateDeck(true)}
        onCreateNewHover={preloadCreateDeckModal}
        onStudyHover={preloadStudyDeckModal}
        onManageHover={preloadManageDrawer}
        onEditHover={preloadEditDeckModal}
      />

      <Button onClick={() => setShowCreateDeck(true)} aria-label="Crear mazo" onMouseEnter={preloadCreateDeckModal} onFocus={preloadCreateDeckModal} className="fixed bottom-6 right-6 z-40 lg:hidden !rounded-full !p-4 shadow-xl" size="icon">
        <Plus size={20} />
      </Button>

      {showCreateDeck && <CreateDeckModal onClose={() => setShowCreateDeck(false)} onCreated={(deck) => { addDeck(deck); setShowCreateDeck(false); }} />}
      {editDeck && <EditDeckModal deck={editDeck} onClose={() => setEditDeckId(null)} onUpdated={(deck) => { updateDeck(deck); setEditDeckId(null); }} onDelete={() => setDeletingDeckId(editDeck.id)} />}
      {manageDeck && <ManageDrawer deck={manageDeck} onClose={() => setManageDeckId(null)} onWordCountChange={(count) => setWordCount(manageDeck.id, count)} />}
      {deletingDeckId && (
        <div className="fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-border-default bg-surface-raised px-4 py-3 text-body-sm shadow-lg">
          <span className="text-fg-secondary">Eliminar &ldquo;{decks.find((deck) => deck.id === deletingDeckId)?.name}&rdquo;?</span>
          <button type="button" className="font-semibold text-error" onClick={confirmDeleteDeck}>Eliminar</button>
          <button type="button" className="text-fg-muted" onClick={() => setDeletingDeckId(null)}>Cancelar</button>
        </div>
      )}
    </div>
  );
}


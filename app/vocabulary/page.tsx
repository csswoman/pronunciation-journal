"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";

import PageLayout from "@/components/layout/PageLayout";
import Section from "@/components/layout/Section";
import Button from "@/components/ui/Button";
import VocabTabs, { type VocabTabId } from "@/components/vocabulary/VocabTabs";
import { VocabularyHero } from "@/components/vocabulary/VocabularyHero";
import { WordsTab } from "@/components/vocabulary/words/WordsTab";
import { DecksTab } from "@/components/vocabulary/decks/DecksTab";

import { useWords } from "@/hooks/useWords";
import { QuickAddModal } from "@/components/vocabulary/words/QuickAddModal";
import { WordSelectionBar } from "@/components/vocabulary/words/WordSelectionBar";
import { computeStrengthStats } from "@/lib/word-bank/strength";

import { useDeckData } from "@/hooks/useDeckData";
import { CreateDeckModal } from "@/components/vocabulary/decks/CreateDeckModal";
import { CreateDeckFromWordsModal } from "@/components/vocabulary/decks/CreateDeckFromWordsModal";
import { AddToExistingDeckModal } from "@/components/vocabulary/decks/AddToExistingDeckModal";
import { EditDeckModal } from "@/components/vocabulary/decks/EditDeckModal";
import { StudyModal } from "@/components/vocabulary/decks/StudyModal";
import { StudyModalWordBank } from "@/components/vocabulary/decks/StudyModalWordBank";
import { ManageDrawer } from "@/components/vocabulary/decks/ManageDrawer";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { wordBankSource } from "@/lib/decks/study-source";
import { useAuth } from "@/components/auth/AuthProvider";

export default function VocabularyPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as VocabTabId | null) ?? "words";
  const [activeTab, setActiveTab] = useState<VocabTabId>(initialTab);

  const handleTabChange = (tab: VocabTabId) => {
    setActiveTab(tab);
    router.replace(`/vocabulary?tab=${tab}`, { scroll: false });
  };

  // ── Words ──────────────────────────────────────────────────────────────────
  const { words, loading: wordsLoading, error: wordsError, addWord, removeWord, retry } = useWords();
  const [showAddWord, setShowAddWord] = useState(false);
  const [initialWordText, setInitialWordText] = useState("");
  const [wordActionError, setWordActionError] = useState<string | null>(null);
  const [selectedWordIds, setSelectedWordIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [showCreateFromWords, setShowCreateFromWords] = useState(false);
  const [showAddToExisting, setShowAddToExisting] = useState(false);

  useEffect(() => {
    if (!wordActionError) return;
    const t = setTimeout(() => setWordActionError(null), 4000);
    return () => clearTimeout(t);
  }, [wordActionError]);

  useEffect(() => {
    if (activeTab !== "words") return;
    const onKey = (e: KeyboardEvent) => {
      if (showAddWord) return;
      const target = e.target as HTMLElement | null;
      const isTyping = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
      if (isTyping) return;
      if (e.key === "n" || e.key === "N") { e.preventDefault(); setShowAddWord(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showAddWord, activeTab]);

  const toggleWordSelection = (id: string) => {
    setSelectedWordIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleToggleSelectMode = () => {
    setSelectMode(prev => {
      if (prev) setSelectedWordIds(new Set());
      return !prev;
    });
  };

  const handleAddWord = async (input: { text: string; context?: string | null; deckId?: string | null }) => {
    try { await addWord(input); } catch (err) {
      setWordActionError(err instanceof Error ? err.message : "Failed to save word");
    }
  };

  const wordStats = useMemo(() => ({
    total: words.length,
    ready: words.filter(w => w.status === "ready").length,
    processing: words.filter(w => w.status === "processing").length,
    strength: computeStrengthStats(words),
  }), [words]);

  // ── Decks ──────────────────────────────────────────────────────────────────
  const { decks, counts, loading: decksLoading, addDeck, updateDeck, removeDeck, setWordCount } = useDeckData();
  const [showCreateDeck, setShowCreateDeck] = useState(false);
  const [editDeckId, setEditDeckId] = useState<string | null>(null);
  const [studyDeckId, setStudyDeckId] = useState<string | null>(null);
  const [manageDeckId, setManageDeckId] = useState<string | null>(null);
  const [wordBankStudyDeckId, setWordBankStudyDeckId] = useState<string | null>(null);

  const editDeck = decks.find(d => d.id === editDeckId) ?? null;
  const studyDeck = decks.find(d => d.id === studyDeckId) ?? null;
  const manageDeck = decks.find(d => d.id === manageDeckId) ?? null;
  const wordBankStudyDeck = decks.find(d => d.id === wordBankStudyDeckId) ?? null;

  const handleStudyDeck = async (deckId: string) => {
    if (!user) return;
    const { count } = await getSupabaseBrowserClient()
      .from("word_bank_decks")
      .select("*", { count: "exact", head: true })
      .eq("deck_id", deckId);
    if ((count ?? 0) > 0) setWordBankStudyDeckId(deckId);
    else setStudyDeckId(deckId);
  };

  const handleDeleteDeck = async (id: string) => {
    const name = decks.find(d => d.id === id)?.name;
    if (!confirm(`Delete deck "${name}"? This cannot be undone.`)) return;
    await getSupabaseBrowserClient().from("decks").delete().eq("id", id);
    removeDeck(id);
    setEditDeckId(null);
  };

  // Full-screen study modes
  if (wordBankStudyDeck && user) {
    return (
      <StudyModalWordBank
        source={wordBankSource({ deckId: wordBankStudyDeck.id, userId: user.id, deckLabel: wordBankStudyDeck.name })}
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
            onWordCountChange={count => setWordCount(manageDeckId!, count)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <PageLayout cardWrapper={false}>
        <VocabularyHero
          activeTab={activeTab}
          wordStats={wordStats}
          deckCount={decks.length}
          wordsLoading={wordsLoading}
          onAddWord={() => setShowAddWord(true)}
          onAddDeck={() => setShowCreateDeck(true)}
        />

        <div className="mb-3">
          <VocabTabs active={activeTab} onChange={handleTabChange} />
        </div>

        <Section spacing="lg">
          {activeTab === "words" && (
            <WordsTab
              words={words}
              loading={wordsLoading}
              error={wordsError}
              actionError={wordActionError}
              wordStats={wordStats}
              selectedWordIds={selectedWordIds}
              selectMode={selectMode}
              onToggleSelectMode={handleToggleSelectMode}
              onToggleWordSelection={toggleWordSelection}
              onRetry={async id => { try { await retry(id); } catch { setWordActionError("Failed to retry"); } }}
              onDelete={async id => { try { await removeWord(id); } catch { setWordActionError("Failed to delete"); } }}
              onOpenAddWord={(text) => { setInitialWordText(text ?? ""); setShowAddWord(true); }}
            />
          )}

          {activeTab === "decks" && (
            <DecksTab
              decks={decks}
              counts={{ ...counts }}
              loading={decksLoading}
              onStudy={handleStudyDeck}
              onManage={setManageDeckId}
              onEdit={setEditDeckId}
              onDelete={handleDeleteDeck}
              onCreateNew={() => setShowCreateDeck(true)}
            />
          )}
        </Section>
      </PageLayout>

      {/* Mobile FAB */}
      <Button
        onClick={() => activeTab === "words" ? setShowAddWord(true) : setShowCreateDeck(true)}
        aria-label={activeTab === "words" ? "Quick add word" : "Create deck"}
        className="fixed bottom-6 right-6 z-40 lg:hidden !rounded-full !p-4 shadow-xl"
        size="icon"
      >
        <Plus size={20} />
      </Button>

      {selectMode && selectedWordIds.size > 0 && (
        <WordSelectionBar
          count={selectedWordIds.size}
          onClear={() => setSelectedWordIds(new Set())}
          onCreateDeck={() => setShowCreateFromWords(true)}
          onAddToExistingDeck={() => setShowAddToExisting(true)}
        />
      )}

      <QuickAddModal
        open={showAddWord}
        onClose={() => { setShowAddWord(false); setInitialWordText(""); }}
        onSubmit={handleAddWord}
        initialText={initialWordText}
      />

      {showCreateFromWords && (
        <CreateDeckFromWordsModal
          wordIds={Array.from(selectedWordIds)}
          onClose={() => setShowCreateFromWords(false)}
          onCreated={deck => {
            addDeck(deck);
            setShowCreateFromWords(false);
            setSelectedWordIds(new Set());
            setActiveTab("decks");
            router.replace("/vocabulary?tab=decks", { scroll: false });
          }}
        />
      )}
      {showAddToExisting && (
        <AddToExistingDeckModal
          wordIds={Array.from(selectedWordIds)}
          decks={decks}
          onClose={() => setShowAddToExisting(false)}
          onAdded={() => { setShowAddToExisting(false); setSelectedWordIds(new Set()); }}
        />
      )}

      {showCreateDeck && (
        <CreateDeckModal
          onClose={() => setShowCreateDeck(false)}
          onCreated={deck => { addDeck(deck); setShowCreateDeck(false); }}
        />
      )}
      {editDeck && (
        <EditDeckModal
          deck={editDeck}
          onClose={() => setEditDeckId(null)}
          onUpdated={deck => { updateDeck(deck); setEditDeckId(null); }}
          onDelete={() => handleDeleteDeck(editDeck.id)}
        />
      )}
      {manageDeck && (
        <ManageDrawer
          deck={manageDeck}
          onClose={() => setManageDeckId(null)}
          onWordCountChange={count => setWordCount(manageDeckId!, count)}
        />
      )}
    </>
  );
}

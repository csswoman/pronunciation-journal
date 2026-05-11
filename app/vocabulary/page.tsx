"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Clock3, Plus, Search } from "lucide-react";

// Layout
import PageLayout from "@/components/layout/PageLayout";
import Section from "@/components/layout/Section";
import Card from "@/components/layout/Card";
import Button from "@/components/ui/Button";

// Tabs
import VocabTabs, { type VocabTabId } from "@/components/vocabulary/VocabTabs";

// Words tab
import { useWords } from "@/hooks/useWords";
import { QuickAddModal } from "@/components/vocabulary/words/QuickAddModal";
import { WordCard } from "@/components/vocabulary/words/WordCard";
import { WordSelectionBar } from "@/components/vocabulary/words/WordSelectionBar";

// Decks tab
import { useDeckData } from "@/hooks/useDeckData";
import { DeckGrid } from "@/components/vocabulary/decks/DeckGrid";
import { CreateDeckModal } from "@/components/vocabulary/decks/CreateDeckModal";
import { CreateDeckFromWordsModal } from "@/components/vocabulary/decks/CreateDeckFromWordsModal";
import { AddToExistingDeckModal } from "@/components/vocabulary/decks/AddToExistingDeckModal";
import { EditDeckModal } from "@/components/vocabulary/decks/EditDeckModal";
import { StudyModal } from "@/components/vocabulary/decks/StudyModal";
import { StudyModalWordBank } from "@/components/vocabulary/decks/StudyModalWordBank";
import { SmartDeckCard } from "@/components/vocabulary/decks/SmartDeckCard";
import { ManageDrawer } from "@/components/vocabulary/decks/ManageDrawer";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { wordBankSource } from "@/lib/decks/study-source";
import { useAuth } from "@/components/auth/AuthProvider";

// ── Search/filter helpers ───────────────────────────────────────────────────
const ITEMS_PER_PAGE = 12;
type WordFilter = "all" | "difficult" | "ready" | "processing";

// ── Main page ───────────────────────────────────────────────────────────────
export default function VocabularyPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as VocabTabId | null) ?? "words";
  const [activeTab, setActiveTab] = useState<VocabTabId>(initialTab);

  // Sync tab → URL without full navigation
  const handleTabChange = (tab: VocabTabId) => {
    setActiveTab(tab);
    router.replace(`/vocabulary?tab=${tab}`, { scroll: false });
  };

  // ── Words state ──────────────────────────────────────────────────────────
  const { words, loading: wordsLoading, error: wordsError, addWord, removeWord, markDifficult, retry } = useWords();
  const [showAddWord, setShowAddWord] = useState(false);
  const [wordActionError, setWordActionError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<WordFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [initialWordText, setInitialWordText] = useState("");
  const [selectedWordIds, setSelectedWordIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [showCreateFromWords, setShowCreateFromWords] = useState(false);
  const [showAddToExisting, setShowAddToExisting] = useState(false);

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

  useEffect(() => {
    if (!wordActionError) return;
    const t = setTimeout(() => setWordActionError(null), 4000);
    return () => clearTimeout(t);
  }, [wordActionError]);

  const wordStats = useMemo(() => ({
    total: words.length,
    ready: words.filter(w => w.status === "ready").length,
    processing: words.filter(w => w.status === "processing").length,
    difficult: words.filter(w => w.difficulty > 0).length,
  }), [words]);

  const filteredWords = useMemo(() => {
    let result = words;
    if (filterType === "difficult") result = result.filter(w => w.difficulty > 0);
    else if (filterType === "ready") result = result.filter(w => w.status === "ready");
    else if (filterType === "processing") result = result.filter(w => w.status === "processing");
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(w =>
        w.text.toLowerCase().includes(q) ||
        w.translation?.toLowerCase().includes(q) ||
        w.meaning?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [words, filterType, searchQuery]);

  const totalPages = Math.ceil(filteredWords.length / ITEMS_PER_PAGE);
  const paginatedWords = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredWords.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredWords, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [filterType, searchQuery]);

  // Keyboard shortcut N → open quick-add (only when on words tab)
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

  const handleAddWord = async (input: { text: string; context?: string | null; deckId?: string | null }) => {
    try { await addWord(input); } catch (err) {
      setWordActionError(err instanceof Error ? err.message : "Failed to save word");
    }
  };

  // ── Decks state ──────────────────────────────────────────────────────────
  const { decks, counts, loading: decksLoading, addDeck, updateDeck, removeDeck, setWordCount } = useDeckData();
  const [showCreateDeck, setShowCreateDeck] = useState(false);
  const [editDeckId, setEditDeckId] = useState<string | null>(null);
  const [studyDeckId, setStudyDeckId] = useState<string | null>(null);
  const [manageDeckId, setManageDeckId] = useState<string | null>(null);

  const editDeck = decks.find(d => d.id === editDeckId) ?? null;
  const studyDeck = decks.find(d => d.id === studyDeckId) ?? null;
  const manageDeck = decks.find(d => d.id === manageDeckId) ?? null;

  // Smart deck study
  const [studyingSmartDeck, setStudyingSmartDeck] = useState(false);

  // Word-bank study: when a deck has word_bank_decks entries, use StudyModalWordBank
  const [wordBankStudyDeckId, setWordBankStudyDeckId] = useState<string | null>(null);
  const wordBankStudyDeck = decks.find(d => d.id === wordBankStudyDeckId) ?? null;

  const handleStudyDeck = async (deckId: string) => {
    if (!user) return;
    const supabase = getSupabaseBrowserClient();
    const { count } = await supabase
      .from("word_bank_decks")
      .select("*", { count: "exact", head: true })
      .eq("deck_id", deckId);
    if ((count ?? 0) > 0) {
      setWordBankStudyDeckId(deckId);
    } else {
      setStudyDeckId(deckId);
    }
  };

  const handleDeleteDeck = async (id: string) => {
    const name = decks.find(d => d.id === id)?.name;
    if (!confirm(`Delete deck "${name}"? This cannot be undone.`)) return;
    await getSupabaseBrowserClient().from("decks").delete().eq("id", id);
    removeDeck(id);
    setEditDeckId(null);
  };

  // Smart deck study
  if (studyingSmartDeck && user) {
    return (
      <StudyModalWordBank
        source={wordBankSource({ smart: "difficult", userId: user.id })}
        onClose={() => setStudyingSmartDeck(false)}
      />
    );
  }

  // Study mode (word bank source) takes over the full screen
  if (wordBankStudyDeck && user) {
    return (
      <StudyModalWordBank
        source={wordBankSource({ deckId: wordBankStudyDeck.id, userId: user.id, deckLabel: wordBankStudyDeck.name })}
        onClose={() => setWordBankStudyDeckId(null)}
      />
    );
  }

  // Study mode (legacy entries source) takes over the full screen
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
        <div className="sticky top-0 z-30 mb-0 -mx-6 px-6 pt-3 pb-2 lg:-mx-10 lg:px-10 bg-[color-mix(in_oklch,var(--surface-base)_92%,transparent)] backdrop-blur shadow-[0_1px_0_var(--line-divider)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[var(--primary)] opacity-60">Vocabulary</p>
              <h1 className="text-xl font-bold leading-[1.2] text-fg">{activeTab === "words" ? "Word Bank" : "Decks"}</h1>
            </div>
            {activeTab === "words" ? (
              <Button onClick={() => setShowAddWord(true)} icon={<Plus size={16} />}>New Word</Button>
            ) : (
              <Button onClick={() => setShowCreateDeck(true)} icon={<Plus size={16} />}>New Deck</Button>
            )}
          </div>
        </div>
        {/* Tab bar */}
        <div className="py-5">
          <VocabTabs active={activeTab} onChange={handleTabChange} />
        </div>

        <Section spacing="lg">
          {/* ── Words tab ────────────────────────────────────────────────── */}
          {activeTab === "words" && (
            <>
              {/* Filter pills */}
              {!wordsLoading && words.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                  {(["all", "ready", "processing", "difficult"] as WordFilter[]).map(f => {
                    const count = f === "all" ? wordStats.total : f === "ready" ? wordStats.ready : f === "processing" ? wordStats.processing : wordStats.difficult;
                    if (f === "processing" && count === 0) return null;
                    if (f === "difficult" && count === 0) return null;
                    const label = f === "all" ? "All" : f === "ready" ? "To review" : f === "processing" ? "Enriching" : "Hard for me";
                    return (
                      <button
                        key={f}
                        onClick={() => setFilterType(f)}
                        className={`inline-flex items-center gap-1 px-[10px] py-1 rounded-full text-xs font-medium border transition-colors ${
                          filterType === f
                            ? "bg-[var(--primary)] text-on-primary border-[var(--primary)]"
                            : "border-[var(--line-divider)] bg-[var(--card-bg)] text-fg-muted hover:border-[var(--primary)]"
                        }`}
                      >
                        <span className="opacity-85">{label}</span>
                        <span
                          className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[11px] font-semibold tabular-nums"
                          style={{
                            background: filterType === f
                              ? "color-mix(in oklch, var(--overlay-light) 80%, transparent)"
                              : "color-mix(in oklch, var(--primary) 16%, transparent)",
                            color: filterType === f ? "var(--on-primary)" : "var(--primary)",
                          }}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleToggleSelectMode} className="!text-[11px] !text-fg-muted">
                      {selectMode ? "Cancel" : "Select"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Search */}
              {!wordsLoading && words.length > 0 && (
                <div className="mt-0 mb-3.5 flex items-center justify-between gap-3">
                  <div className="relative w-full md:w-[62%]">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle opacity-70 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search by word, translation, or meaning…"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          const q = searchQuery.trim();
                          if (q && !words.some(w => w.text.toLowerCase() === q.toLowerCase())) {
                            setInitialWordText(q);
                            setSearchQuery("");
                            setShowAddWord(true);
                          }
                        }
                      }}
                      className="w-full pl-9 pr-3 py-2.5 rounded-[var(--radius-sm)] border text-sm text-fg placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_oklch,var(--primary)_20%,transparent)]"
                      style={{
                        borderColor: "color-mix(in oklch, var(--line-divider) 75%, transparent)",
                        borderWidth: "0.5px",
                        background: "color-mix(in oklch, var(--surface-sunken) 68%, var(--surface-base))",
                      }}
                    />
                  </div>
                  <p className="hidden md:inline-flex items-center gap-1.5 text-[12px] text-fg-subtle whitespace-nowrap">
                    <Clock3 size={12} />
                    <span>Last session 2 days ago · </span>
                    <span className="text-[var(--primary)] font-semibold">3</span>
                    <span>due</span>
                  </p>
                </div>
              )}

              {/* Errors */}
              {(wordsError || wordActionError) && (
                <Card className="!p-3 border-[var(--error)]/40 bg-[color-mix(in_oklch,var(--error)_8%,var(--card-bg))]">
                  <p className="text-sm text-[var(--error)]">{wordsError ?? wordActionError}</p>
                </Card>
              )}

              {/* Word list */}
              {wordsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <Card key={i} className="h-20 rounded-2xl animate-pulse" style={{ backgroundColor: "var(--btn-regular-bg)" }}>
                      <div />
                    </Card>
                  ))}
                </div>
              ) : words.length === 0 ? (
                <WordsEmptyState onAdd={() => setShowAddWord(true)} />
              ) : filteredWords.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-sm text-fg-muted">No words found matching your search or filter.</p>
                </Card>
              ) : (
                <>
                  <div className="space-y-1.5">
                    {paginatedWords.map(word => (
                      <WordCard
                        key={word.id}
                        word={word}
                        onMarkDifficult={async id => { try { await markDifficult(id); } catch { setWordActionError("Failed to update"); } }}
                        onRetry={async id => { try { await retry(id); } catch { setWordActionError("Failed to retry"); } }}
                        onDelete={async id => { try { await removeWord(id); } catch { setWordActionError("Failed to delete"); } }}
                        selected={selectedWordIds.has(word.id)}
                        onSelect={selectMode ? toggleWordSelection : undefined}
                      />
                    ))}
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <p className="text-sm text-fg-muted">
                        Page <span className="font-semibold">{currentPage}</span> of <span className="font-semibold">{totalPages}</span>
                      </p>
                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
                        <Button variant="secondary" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* ── Decks tab ────────────────────────────────────────────────── */}
          {activeTab === "decks" && (
            decksLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <Card key={i} className="h-52 rounded-2xl animate-pulse" style={{ backgroundColor: "var(--btn-regular-bg)" }}>
                    <div />
                  </Card>
                ))}
              </div>
            ) : decks.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl" style={{ backgroundColor: "var(--btn-regular-bg)" }}>📚</div>
                  <div>
                    <p className="text-sm font-semibold text-fg">No decks yet</p>
                    <p className="text-xs mt-1 text-fg-subtle">Create your first deck to organize vocabulary by theme.</p>
                  </div>
                  <Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowCreateDeck(true)} className="mt-2">
                    Create a deck
                  </Button>
                </div>
              </Card>
            ) : (
              <>
                {wordStats.difficult > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <SmartDeckCard
                        count={wordStats.difficult}
                        onStudy={() => setStudyingSmartDeck(true)}
                      />
                    </div>
                  </div>
                )}
                <DeckGrid
                  decks={decks}
                  counts={counts}
                  onStudy={handleStudyDeck}
                  onManage={setManageDeckId}
                  onEdit={setEditDeckId}
                  onDelete={handleDeleteDeck}
                  onCreateNew={() => setShowCreateDeck(true)}
                />
              </>
            )
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

      {/* Word selection bar */}
      {selectMode && selectedWordIds.size > 0 && (
        <WordSelectionBar
          count={selectedWordIds.size}
          onClear={() => setSelectedWordIds(new Set())}
          onCreateDeck={() => setShowCreateFromWords(true)}
          onAddToExistingDeck={() => setShowAddToExisting(true)}
        />
      )}

      {/* Words modals */}
      <QuickAddModal
        open={showAddWord}
        onClose={() => { setShowAddWord(false); setInitialWordText(""); }}
        onSubmit={handleAddWord}
        initialText={initialWordText}
      />

      {/* Word-to-deck modals */}
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
          onAdded={() => {
            setShowAddToExisting(false);
            setSelectedWordIds(new Set());
          }}
        />
      )}

      {/* Decks modals */}
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

// ── Sub-components ──────────────────────────────────────────────────────────

function WordsEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <Card className="p-12 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "color-mix(in oklch, var(--primary) 10%, var(--btn-regular-bg))", color: "var(--primary)" }}>
          <Plus size={28} />
        </div>
        <div>
          <p className="text-sm font-semibold text-fg">Your word bank is empty</p>
          <p className="text-xs mt-1 max-w-sm text-fg-subtle">Save any word you encounter — Gemini adds meaning, translation, IPA and an example automatically.</p>
        </div>
        <Button onClick={onAdd} icon={<Plus size={16} />}>Add your first word</Button>
        <p className="text-tiny uppercase tracking-widest text-fg-subtle">
          Tip: press <kbd className="px-1.5 py-0.5 rounded bg-[var(--btn-regular-bg)] font-mono">N</kbd> anywhere
        </p>
      </div>
    </Card>
  );
}

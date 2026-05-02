"use client";
import { useState } from "react";
import Image from "next/image";
import { Plus } from "lucide-react";
import { useDeckData } from "./hooks/useDeckData";
import { DeckGrid } from "./components/DeckGrid";
import { CreateDeckModal } from "./components/CreateDeckModal";
import { EditDeckModal } from "./components/EditDeckModal";
import { StudyModal } from "./components/StudyModal";
import { ManageDrawer } from "./components/ManageDrawer";
import Section from "@/components/layout/Section";
import PageHeader from "@/components/layout/PageHeader";
import PageLayout from "@/components/layout/PageLayout";
import Card from "@/components/layout/Card";
import Button from "@/components/ui/Button";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function DecksPage() {
  const { decks, counts, loading, addDeck, updateDeck, removeDeck, setWordCount } = useDeckData();
  const [showCreate, setShowCreate] = useState(false);
  const [editDeckId, setEditDeckId] = useState<string | null>(null);
  const [studyDeckId, setStudyDeckId] = useState<string | null>(null);
  const [manageDeckId, setManageDeckId] = useState<string | null>(null);

  const editDeck = decks.find(d => d.id === editDeckId) ?? null;
  const studyDeck = decks.find(d => d.id === studyDeckId) ?? null;
  const manageDeck = decks.find(d => d.id === manageDeckId) ?? null;

  const handleDelete = async (id: string) => {
    const name = decks.find(d => d.id === id)?.name;
    if (!confirm(`Delete deck "${name}"? This cannot be undone.`)) return;
    await getSupabaseBrowserClient().from("decks").delete().eq("id", id);
    removeDeck(id);
    setEditDeckId(null);
  };

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
      <PageLayout
        hero={
          <PageHeader
            badge="Vocabulary Builder"
            title="Decks"
            subtitle="Study by Topic"
            description="Build word sets and review them fast."
            primaryCta={{ label: "New Deck", icon: <Plus size={16} />, onClick: () => setShowCreate(true) }}
            illustration={
              <Image src="/illustrations/options.svg" alt="Deck options illustration" width={560} height={360} priority />
            }
          />
        }
      >
        <Section spacing="lg">
          {loading ? (
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
                  <p className="text-sm font-semibold" style={{ color: "var(--deep-text)" }}>No decks yet</p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>Create your first deck to organize vocabulary by theme.</p>
                </div>
                <Button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[var(--primary)] text-white hover:opacity-90 transition-colors mt-2">
                  <Plus size={16} /> Create a deck
                </Button>
              </div>
            </Card>
          ) : (
            <DeckGrid
              decks={decks}
              counts={counts}
              onStudy={setStudyDeckId}
              onManage={setManageDeckId}
              onEdit={setEditDeckId}
              onDelete={handleDelete}
              onCreateNew={() => setShowCreate(true)}
            />
          )}
        </Section>
      </PageLayout>

      {showCreate && (
        <CreateDeckModal onClose={() => setShowCreate(false)} onCreated={deck => { addDeck(deck); setShowCreate(false); }} />
      )}
      {editDeck && (
        <EditDeckModal
          deck={editDeck}
          onClose={() => setEditDeckId(null)}
          onUpdated={deck => { updateDeck(deck); setEditDeckId(null); }}
          onDelete={() => handleDelete(editDeck.id)}
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

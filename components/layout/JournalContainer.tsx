"use client";

import { useState, useEffect } from "react";
import { Entry, Difficulty } from "@/lib/types";
import { getEntries, deleteEntry } from "@/lib/storage";
import { cleanupBlobUrls } from "@/lib/cleanupStorage";
import Navbar from "@/components/layout/Navbar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MainContent from "@/components/layout/MainContent";
import ApiWordModal from "@/components/entries/ApiWordModal";
import WordsTab from "@/components/ui/WordsTab";
import DecksTab from "@/components/decks/DecksTab";
import IPAChart from "@/components/ipa/IPAChart";

export default function JournalContainer() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [activeTab, setActiveTab] = useState<"words" | "decks" | "ipa">("words");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDifficulties, setSelectedDifficulties] = useState<Difficulty[]>([]);
  const [selectedApiWord, setSelectedApiWord] = useState<string | null>(null);
  const [isAsideCollapsed, setIsAsideCollapsed] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);

  useEffect(() => {
    cleanupBlobUrls();
    const loadEntries = async () => {
      const loadedEntries = await getEntries();
      setEntries(loadedEntries);
    };
    loadEntries();
  }, []);

  const refreshEntries = async () => {
    const loadedEntries = await getEntries();
    setEntries(loadedEntries);
  };

  const handleToggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedEntries([]);
  };

  const handleSelectEntry = (id: string) => {
    setSelectedEntries(prev =>
      prev.includes(id) ? prev.filter(entryId => entryId !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = async () => {
    if (selectedEntries.length === 0) return;

    const confirmMessage = `¿Estás seguro de que quieres eliminar ${selectedEntries.length} palabra${
      selectedEntries.length > 1 ? "s" : ""
    }?`;

    if (confirm(confirmMessage)) {
      await Promise.all(selectedEntries.map(id => deleteEntry(id)));
      await refreshEntries();
      setSelectedEntries([]);
      setIsSelectionMode(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header title="Pronunciation Journal" />
      <div className="flex flex-1">
        <Navbar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isCollapsed={isAsideCollapsed}
          onToggleCollapse={() => setIsAsideCollapsed(!isAsideCollapsed)}
        />
        <MainContent>
          {activeTab === "words" ? (
            <>
              <WordsTab
                entries={entries}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                selectedDifficulties={selectedDifficulties}
                onDifficultyChange={setSelectedDifficulties}
                isSelectionMode={isSelectionMode}
                selectedEntries={selectedEntries}
                onToggleSelectionMode={handleToggleSelectionMode}
                onSelectEntry={handleSelectEntry}
                onDeleteSelected={handleDeleteSelected}
                onSave={refreshEntries}
                onWordSelect={setSelectedApiWord}
                onEntryUpdated={refreshEntries}
              />

              {selectedApiWord && (
                <ApiWordModal
                  word={selectedApiWord}
                  onClose={() => setSelectedApiWord(null)}
                  onSave={refreshEntries}
                />
              )}
            </>
          ) : activeTab === "decks" ? (
            <DecksTab />
          ) : (
            <IPAChart />
          )}
        </MainContent>
      </div>
      <Footer />
    </div>
  );
}


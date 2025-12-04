"use client";

import { useState, useEffect, useMemo } from "react";
import { Entry, Difficulty } from "@/lib/types";
import { getEntries } from "@/lib/storage";
import Navbar from "./Navbar";
import Header from "./Header";
import Footer from "./Footer";
import MainContent from "./MainContent";
import AddWordSection from "./AddWordSection";
import EntriesList from "./EntriesList";
import SearchAndFilters from "./SearchAndFilters";
import DifficultyFilters from "./DifficultyFilters";
import ApiWordModal from "./ApiWordModal";

export default function JournalContainer() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"words" | "decks">("words");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<
    Difficulty | "all"
  >("all");
  const [selectedApiWord, setSelectedApiWord] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    setEntries(getEntries());
  }, []);

  const handleSave = (entry: Entry) => {
    setEntries(getEntries());
  };

  const handleWordSelect = (word: string) => {
    setSelectedApiWord(word);
  };

  const handleApiWordSave = () => {
    setEntries(getEntries());
  };

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // Filter by search term
      const matchesSearch =
        searchTerm === "" ||
        entry.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.ipa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.tags?.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        );

      // Filter by difficulty
      const matchesDifficulty =
        selectedDifficulty === "all" || entry.difficulty === selectedDifficulty;

      return matchesSearch && matchesDifficulty;
    });
  }, [entries, searchTerm, selectedDifficulty]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header title="Pronunciation Journal" />
      <div className="flex flex-1">
        <Navbar
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        <MainContent>
          {activeTab === "words" ? (
            <>
              <SearchAndFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onWordSelect={handleWordSelect}
              />
              <AddWordSection onSave={handleSave} />
              <div className="mt-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Your Entries</h2>
                  <DifficultyFilters
                    selectedDifficulty={selectedDifficulty}
                    onDifficultyChange={setSelectedDifficulty}
                  />
                </div>
                <EntriesList entries={filteredEntries} />
              </div>

              {selectedApiWord && (
                <ApiWordModal
                  word={selectedApiWord}
                  onClose={() => setSelectedApiWord(null)}
                  onSave={handleApiWordSave}
                />
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">My Decks</h2>
              <p className="text-gray-500 dark:text-gray-400">Decks functionality coming soon...</p>
            </div>
          )}
        </MainContent>
      </div>
      <Footer />
    </div>
  );
}


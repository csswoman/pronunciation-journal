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

export default function JournalContainer() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"words" | "decks">("words");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<
    Difficulty | "all"
  >("all");

  useEffect(() => {
    setIsMounted(true);
    setEntries(getEntries());
  }, []);

  const handleSave = (entry: Entry) => {
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
                selectedDifficulty={selectedDifficulty}
                onDifficultyChange={setSelectedDifficulty}
              />
              <AddWordSection onSave={handleSave} />
              <div className="space-y-4 mt-8">
                <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Your Entries</h2>
                <EntriesList entries={filteredEntries} />
              </div>
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


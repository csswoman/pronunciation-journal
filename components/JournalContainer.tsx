"use client";

import { useState, useEffect, useMemo } from "react";
import { Entry, Difficulty } from "@/lib/types";
import { getEntries, deleteEntry } from "@/lib/storage";
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
  const [selectedDifficulties, setSelectedDifficulties] = useState<Difficulty[]>([]);
  const [selectedApiWord, setSelectedApiWord] = useState<string | null>(null);
  const [isAsideCollapsed, setIsAsideCollapsed] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);

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

  const handleToggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedEntries([]);
  };

  const handleSelectEntry = (id: string) => {
    if (selectedEntries.includes(id)) {
      setSelectedEntries(selectedEntries.filter(entryId => entryId !== id));
    } else {
      setSelectedEntries([...selectedEntries, id]);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedEntries.length === 0) return;
    
    if (confirm(`¿Estás seguro de que quieres eliminar ${selectedEntries.length} palabra${selectedEntries.length > 1 ? 's' : ''}?`)) {
      // Delete each selected entry
      selectedEntries.forEach(id => {
        deleteEntry(id);
      });
      
      // Force re-fetch from localStorage
      const updatedEntries = getEntries();
      setEntries(updatedEntries);
      setSelectedEntries([]);
      setIsSelectionMode(false);
    }
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

      // Filter by difficulty - if no difficulties selected, show all
      const matchesDifficulty =
        selectedDifficulties.length === 0 || 
        selectedDifficulties.includes(entry.difficulty);

      return matchesSearch && matchesDifficulty;
    });
  }, [entries, searchTerm, selectedDifficulties]);

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
              <SearchAndFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onWordSelect={handleWordSelect}
              />
              <AddWordSection onSave={handleSave} />
              <div className="mt-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    Your Entries
                    {isSelectionMode && selectedEntries.length > 0 && (
                      <span className="ml-3 text-base font-normal text-gray-600 dark:text-gray-400">
                        ({selectedEntries.length} seleccionada{selectedEntries.length > 1 ? 's' : ''})
                      </span>
                    )}
                  </h2>
                  <div className="flex gap-2">
                    {isSelectionMode && selectedEntries.length > 0 && (
                      <button
                        onClick={handleDeleteSelected}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Eliminar
                      </button>
                    )}
                    <button
                      onClick={handleToggleSelectionMode}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isSelectionMode
                          ? "bg-gray-600 hover:bg-gray-700 text-white"
                          : "bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                      }`}
                    >
                      {isSelectionMode ? (
                        <>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Cancelar
                        </>
                      ) : (
                        <>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Seleccionar
                        </>
                      )}
                    </button>
                    <DifficultyFilters
                      selectedDifficulties={selectedDifficulties}
                      onDifficultyChange={setSelectedDifficulties}
                    />
                  </div>
                </div>
                <EntriesList 
                  entries={filteredEntries}
                  isSelectionMode={isSelectionMode}
                  selectedEntries={selectedEntries}
                  onSelectEntry={handleSelectEntry}
                />
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


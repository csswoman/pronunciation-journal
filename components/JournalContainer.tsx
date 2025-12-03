"use client";

import { useState, useEffect } from "react";
import { Entry } from "@/lib/types";
import { getEntries } from "@/lib/storage";
import Navbar from "./Navbar";
import Header from "./Header";
import Footer from "./Footer";
import MainContent from "./MainContent";
import AddWordSection from "./AddWordSection";
import EntriesList from "./EntriesList";

export default function JournalContainer() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"words" | "decks">("words");

  useEffect(() => {
    setIsMounted(true);
    setEntries(getEntries());
  }, []);

  const handleSave = (entry: Entry) => {
    setEntries(getEntries());
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <Header
        title="Pronunciation Journal"
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <MainContent>
        {activeTab === "words" ? (
          <>
            <AddWordSection onSave={handleSave} />
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold mb-4">Your Entries</h2>
              <EntriesList entries={entries} />
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold mb-4">My Decks</h2>
            <p className="text-gray-500">Decks functionality coming soon...</p>
          </div>
        )}
      </MainContent>
      <Footer />
    </div>
  );
}


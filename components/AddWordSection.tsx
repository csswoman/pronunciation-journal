"use client";

import { useState } from "react";
import { Entry } from "@/lib/types";
import EntryForm from "./EntryForm";

interface AddWordSectionProps {
  onSave: (entry: Entry) => void;
}

export default function AddWordSection({ onSave }: AddWordSectionProps) {
  const [showForm, setShowForm] = useState(false);

  const handleSave = (entry: Entry) => {
    onSave(entry);
    setShowForm(false);
  };

  if (!showForm) {
    return (
      <div className="flex justify-center mb-12">
        <button
          onClick={() => setShowForm(true)}
          className="px-6 py-3 rounded-lg accent-button"
        >
          Agregar palabra
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mb-12">
      <EntryForm onSave={handleSave} onCancel={() => setShowForm(false)} />
    </div>
  );
}


"use client";

import { useState } from "react";
import { Entry } from "@/lib/types";
import EntryForm from "./EntryForm";
import Button from "@/components/ui/Button";

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
        <Button
          onClick={() => setShowForm(true)}
          variant="primary"
          size="lg"
        >
          Agregar palabra
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mb-12">
      <EntryForm onSave={handleSave} onCancel={() => setShowForm(false)} />
    </div>
  );
}


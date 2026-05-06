"use client";

import type { AITemplateId } from "@/lib/types";
import TemplateCard, { TEMPLATES } from "./TemplateCard";

interface TemplateGridProps {
  onSelect: (id: AITemplateId) => void;
}

export default function TemplateGrid({ onSelect }: TemplateGridProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-fg">
          Choose a Practice Mode
        </h2>
        <p className="text-sm text-fg-subtle mt-1">
          Select a template to start your session, or scroll down to write your own prompt.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {TEMPLATES.map((t) => (
          <TemplateCard key={t.id} template={t} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

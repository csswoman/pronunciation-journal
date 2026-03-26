"use client";

import type { AITemplateId } from "@/lib/types";
import TemplateCard, { TEMPLATES } from "./TemplateCard";

interface TemplateGridProps {
  onSelect: (id: AITemplateId) => void;
}

export default function TemplateGrid({ onSelect }: TemplateGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {TEMPLATES.map((t) => (
        <TemplateCard key={t.id} template={t} onSelect={onSelect} />
      ))}
    </div>
  );
}

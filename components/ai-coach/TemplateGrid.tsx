"use client";

import type { AITemplateId } from "@/lib/types";
import TemplateCard, { TEMPLATES } from "./TemplateCard";
import { H2 } from "@/components/ui/Typography";

interface TemplateGridProps {
  onSelect: (id: AITemplateId) => void;
}

export default function TemplateGrid({ onSelect }: TemplateGridProps) {
  return (
    <div className="space-y-4">
      <div>
        <H2 className="text-h4">
          Choose a Practice Mode
        </H2>
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

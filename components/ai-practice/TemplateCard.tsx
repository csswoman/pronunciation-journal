"use client";

import type { AITemplateId } from "@/lib/types";
import { MessageCircle, ClipboardList, Star, ArrowRight, CheckCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface TemplateDefinition {
  id: AITemplateId;
  title: string;
  description: string;
  Icon: LucideIcon;
}

export const TEMPLATES: TemplateDefinition[] = [
  {
    id: "free-conversation",
    title: "Free conversation",
    description: "Chat on any topic with gentle corrections along the way",
    Icon: MessageCircle,
  },
  {
    id: "sentence-correction",
    title: "Correct my sentence",
    description: "Write a sentence and get a correction, explanation & improved version",
    Icon: CheckCheck,
  },
  {
    id: "practice-questions",
    title: "Practice questions",
    description: "Questions, sentence exercises & a correction drill on any topic",
    Icon: ClipboardList,
  },
  {
    id: "personalized-practice",
    title: "Personalized practice",
    description: "Exercises built from your struggling words and favorites",
    Icon: Star,
  },
];

interface TemplateCardProps {
  template: TemplateDefinition;
  onSelect: (id: AITemplateId) => void;
  recommended?: boolean;
}

export default function TemplateCard({ template, onSelect, recommended }: TemplateCardProps) {
  const { Icon } = template;

  return (
    <button
      onClick={() => onSelect(template.id)}
      className="group relative flex flex-col items-center gap-2.5 p-4 rounded-2xl border transition-all hover:shadow-md hover:-translate-y-0.5 text-center cursor-pointer"
      style={{
        backgroundColor: "var(--card-bg)",
        borderColor: "var(--line-divider)",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--primary)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--line-divider)";
      }}
    >
      {recommended && (
        <span
          className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap"
          style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
        >
          Recommended
        </span>
      )}

      <div
        className="w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
        style={{ backgroundColor: "var(--accent-subtle, var(--btn-regular-bg))", color: "var(--primary)" }}
      >
        <Icon size={18} strokeWidth={1.8} />
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold leading-tight" style={{ color: "var(--text-primary)" }}>
          {template.title}
        </p>
        <p className="text-xs leading-snug" style={{ color: "var(--text-tertiary)" }}>
          {template.description}
        </p>
      </div>

      <div
        className="w-6 h-6 rounded-full flex items-center justify-center transition-colors mt-auto"
        style={{ backgroundColor: "var(--btn-regular-bg)", color: "var(--primary)" }}
      >
        <ArrowRight size={12} />
      </div>
    </button>
  );
}


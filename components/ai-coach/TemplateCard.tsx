"use client";

import type { AITemplateId } from "@/lib/types";
import { MessageCircle, ClipboardList, Star, CheckCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface TemplateDefinition {
  id: AITemplateId;
  title: string;
  description: string;
  Icon: LucideIcon;
  color: string;
  colorBg: string;
}

export const TEMPLATES: TemplateDefinition[] = [
  {
    id: "free-conversation",
    title: "Free conversation",
    description: "Talk freely about any topic and improve naturally.",
    Icon: MessageCircle,
    color: "var(--primary)",
    colorBg: "var(--primary-100)",
  },
  {
    id: "sentence-correction",
    title: "Correct my sentences",
    description: "Write and get corrections with explanations.",
    Icon: CheckCheck,
    color: "var(--success)",
    colorBg: "var(--success-soft)",
  },
  {
    id: "practice-questions",
    title: "Practice questions",
    description: "Answer questions and expand your thinking.",
    Icon: ClipboardList,
    color: "var(--error)",
    colorBg: "var(--error-soft)",
  },
  {
    id: "personalized-practice",
    title: "Personalized",
    description: "Practice based on your goals and level.",
    Icon: Star,
    color: "var(--warning)",
    colorBg: "var(--warning-soft)",
  },
];

interface TemplateCardProps {
  template: TemplateDefinition;
  onSelect: (id: AITemplateId) => void;
  recommended?: boolean;
}

export default function TemplateCard({ template, onSelect }: TemplateCardProps) {
  const { Icon, color, colorBg } = template;

  return (
    <button
      onClick={() => onSelect(template.id)}
      className="flex flex-col items-center gap-2.5 p-4 rounded-2xl transition-all bg-surface-raised shadow-md hover:shadow-lg hover:-translate-y-px text-center cursor-pointer"
    >
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center"
        style={{ backgroundColor: colorBg, color }}
      >
        <Icon size={20} strokeWidth={1.8} />
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold leading-tight text-fg">
          {template.title}
        </p>
        <p className="text-xs leading-snug text-fg-subtle">
          {template.description}
        </p>
      </div>
    </button>
  );
}

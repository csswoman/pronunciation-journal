"use client";

import type { AITemplateId } from "@/lib/types";
import { MessageCircle, ClipboardList, Star, CheckCheck, ArrowUpRight } from "lucide-react";
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
  const { Icon, color } = template;

  return (
    <button
      onClick={() => onSelect(template.id)}
      className="group relative p-4 rounded-2xl bg-[var(--surface-raised)] border border-[var(--border-subtle)] text-left cursor-pointer transition-[transform,border-color,box-shadow] duration-200 flex flex-col items-start hover:-translate-y-0.5 hover:shadow-md"
      style={{ ["--card-color" as string]: color }}
    >
      <span
        className="absolute top-3 right-3 size-7 rounded-full flex items-center justify-center opacity-0 -translate-x-1 transition-[opacity,transform] duration-200 group-hover:opacity-100 group-hover:translate-x-0"
        style={{ backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)` }}
      >
        <ArrowUpRight size={14} strokeWidth={2.2} style={{ color }} />
      </span>

      <div
        className="size-10 rounded-xl flex items-center justify-center mb-3 transition-transform duration-200 group-hover:scale-105"
        style={{
          backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)`,
          boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${color} 18%, transparent)`,
        }}
      >
        <Icon size={19} strokeWidth={2} style={{ color }} />
      </div>

      <p className="text-[15px] font-semibold leading-[1.3] text-[var(--text-primary)]">
        {template.title}
      </p>
      <p className="text-[13px] leading-snug text-[var(--text-tertiary)] mt-1">
        {template.description}
      </p>
    </button>
  );
}

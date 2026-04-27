"use client";

import type { AITemplateId } from "@/lib/types";
import { MessageCircle, ClipboardList, Star, CheckCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface TemplateDefinition {
  id: AITemplateId;
  title: string;
  description: string;
  Icon: LucideIcon;
  iconColor: string;
  iconBg: string;
}

export const TEMPLATES: TemplateDefinition[] = [
  {
    id: "free-conversation",
    title: "Free conversation",
    description: "Talk freely about any topic and improve naturally.",
    Icon: MessageCircle,
    iconColor: "#7C6FF7",
    iconBg: "#EEF0FF",
  },
  {
    id: "sentence-correction",
    title: "Correct my sentences",
    description: "Write and get corrections with explanations.",
    Icon: CheckCheck,
    iconColor: "#22C55E",
    iconBg: "#DCFCE7",
  },
  {
    id: "practice-questions",
    title: "Practice questions",
    description: "Answer questions and expand your thinking.",
    Icon: ClipboardList,
    iconColor: "#F97316",
    iconBg: "#FFEDD5",
  },
  {
    id: "personalized-practice",
    title: "Personalized",
    description: "Practice based on your goals and level.",
    Icon: Star,
    iconColor: "#6366F1",
    iconBg: "#EEF2FF",
  },
];

interface TemplateCardProps {
  template: TemplateDefinition;
  onSelect: (id: AITemplateId) => void;
  recommended?: boolean;
}

export default function TemplateCard({ template, onSelect, recommended }: TemplateCardProps) {
  const { Icon, iconColor, iconBg } = template;

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
          className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase whitespace-nowrap"
          style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
        >
          Recommended
        </span>
      )}

      <div
        className="w-11 h-11 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
        style={{ backgroundColor: iconBg, color: iconColor }}
      >
        <Icon size={20} strokeWidth={1.8} />
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold leading-tight" style={{ color: "var(--text-primary)" }}>
          {template.title}
        </p>
        <p className="text-xs leading-snug" style={{ color: "var(--text-tertiary)" }}>
          {template.description}
        </p>
      </div>
    </button>
  );
}

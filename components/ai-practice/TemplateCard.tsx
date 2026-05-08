"use client";

import { useState } from "react";
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
    color: "#c4a8ff",
    colorBg: "rgba(196, 168, 255, 0.1)",
  },
  {
    id: "sentence-correction",
    title: "Correct my sentences",
    description: "Write and get corrections with explanations.",
    Icon: CheckCheck,
    color: "#6ee7b7",
    colorBg: "rgba(110, 231, 183, 0.1)",
  },
  {
    id: "practice-questions",
    title: "Practice questions",
    description: "Answer questions and expand your thinking.",
    Icon: ClipboardList,
    color: "#fda4af",
    colorBg: "rgba(253, 164, 175, 0.1)",
  },
  {
    id: "personalized-practice",
    title: "Personalized",
    description: "Practice based on your goals and level.",
    Icon: Star,
    color: "#fcd34d",
    colorBg: "rgba(252, 211, 77, 0.1)",
  },
];

interface TemplateCardProps {
  template: TemplateDefinition;
  onSelect: (id: AITemplateId) => void;
  recommended?: boolean;
}

export default function TemplateCard({ template, onSelect }: TemplateCardProps) {
  const { Icon, color, colorBg } = template;
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={() => onSelect(template.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex flex-col items-center gap-2.5 p-4 rounded-2xl transition-all hover:shadow-md text-center cursor-pointer"
      style={{
        backgroundColor: "var(--card-bg)",
        borderLeft: "1px solid var(--line-divider)",
        borderRight: "1px solid var(--line-divider)",
        borderBottom: "1px solid var(--line-divider)",
        borderTop: hovered ? `2px solid ${color}` : "2px solid transparent",
        transform: hovered ? "translateY(-1px)" : "none",
      }}
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

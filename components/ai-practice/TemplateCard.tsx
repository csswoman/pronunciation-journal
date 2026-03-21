"use client";

import type { AITemplateId } from "@/lib/types";

export interface TemplateDefinition {
  id: AITemplateId;
  title: string;
  description: string;
  icon: string;
  accent: string; // Tailwind color keyword: "indigo", "violet", "emerald", "sky"
}

export const TEMPLATES: TemplateDefinition[] = [
  {
    id: "practice-questions",
    title: "Practice Questions",
    description: "Questions, sentence exercises & a correction drill on any topic",
    icon: "📝",
    accent: "indigo",
  },
  {
    id: "sentence-correction",
    title: "Sentence Correction",
    description: "Write a sentence and get a correction, explanation & improved version",
    icon: "✏️",
    accent: "amber",
  },
  {
    id: "personalized-practice",
    title: "Personalized Practice",
    description: "Exercises built from your struggling words and favorites",
    icon: "🎯",
    accent: "emerald",
  },
  {
    id: "free-conversation",
    title: "Free Conversation",
    description: "Chat on any topic with gentle corrections along the way",
    icon: "💬",
    accent: "sky",
  },
];

const ACCENT_CLASSES: Record<string, { border: string; bg: string; hover: string }> = {
  indigo: {
    border: "hover:border-indigo-300 dark:hover:border-indigo-600",
    bg: "bg-indigo-100 dark:bg-indigo-900/30",
    hover: "group-hover:text-indigo-600 dark:group-hover:text-indigo-400",
  },
  amber: {
    border: "hover:border-amber-300 dark:hover:border-amber-600",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    hover: "group-hover:text-amber-600 dark:group-hover:text-amber-400",
  },
  emerald: {
    border: "hover:border-emerald-300 dark:hover:border-emerald-600",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    hover: "group-hover:text-emerald-600 dark:group-hover:text-emerald-400",
  },
  sky: {
    border: "hover:border-sky-300 dark:hover:border-sky-600",
    bg: "bg-sky-100 dark:bg-sky-900/30",
    hover: "group-hover:text-sky-600 dark:group-hover:text-sky-400",
  },
};

interface TemplateCardProps {
  template: TemplateDefinition;
  onSelect: (id: AITemplateId) => void;
}

export default function TemplateCard({ template, onSelect }: TemplateCardProps) {
  const ac = ACCENT_CLASSES[template.accent] ?? ACCENT_CLASSES.indigo;

  return (
    <button
      onClick={() => onSelect(template.id)}
      className={`group w-full text-left p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 ${ac.border} hover:shadow-lg transition-all`}
    >
      <div
        className={`w-12 h-12 rounded-xl ${ac.bg} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform shadow-inner`}
      >
        {template.icon}
      </div>
      <p className={`font-semibold text-gray-900 dark:text-gray-100 mb-1 ${ac.hover} transition-colors`}>
        {template.title}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
        {template.description}
      </p>
    </button>
  );
}

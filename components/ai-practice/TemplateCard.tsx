"use client";

import type { AITemplateId } from "@/lib/types";

export interface TemplateDefinition {
  id: AITemplateId;
  title: string;
  description: string;
  iconType: "cards" | "edit" | "star" | "chat";
  accent: "purple" | "emerald" | "violet" | "slate";
  tags: string[];
}

export const TEMPLATES: TemplateDefinition[] = [
  {
    id: "practice-questions",
    title: "Preguntas de Práctica",
    description: "Test your knowledge with adaptive drills and multiple-choice scenarios.",
    iconType: "cards",
    accent: "purple",
    tags: ["15 QUESTIONS", "+50 XP"],
  },
  {
    id: "sentence-correction",
    title: "Corrección de Oraciones",
    description: "Write any sentence and get real-time grammatical and stylistic feedback.",
    iconType: "edit",
    accent: "emerald",
    tags: ["UNLIMITED", "GRAMMAR FIX"],
  },
  {
    id: "personalized-practice",
    title: "Práctica Personalizada",
    description: 'Smart sessions focused exclusively on your "Weak Words" and favorites.',
    iconType: "star",
    accent: "violet",
    tags: ["CUSTOM", "TARGETED"],
  },
  {
    id: "free-conversation",
    title: "Conversación Libre",
    description: "Open dialogue with the AI. Chat about travel, hobbies, or deep philosophy.",
    iconType: "chat",
    accent: "slate",
    tags: ["FLUENT AI", "REAL-TIME"],
  },
];

const ICON_CLASSES: Record<string, string> = {
  purple: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
  emerald: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
  violet: "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400",
  slate: "bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400",
};

const BORDER_CLASSES: Record<string, string> = {
  purple: "hover:border-purple-300 dark:hover:border-purple-600",
  emerald: "hover:border-emerald-300 dark:hover:border-emerald-600",
  violet: "hover:border-violet-300 dark:hover:border-violet-600",
  slate: "hover:border-slate-300 dark:hover:border-slate-600",
};

const TAG_CLASSES: Record<string, string> = {
  purple: "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300",
  emerald: "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300",
  violet: "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300",
  slate: "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400",
};

function TemplateIcon({ type }: { type: string }) {
  switch (type) {
    case "cards":
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
      );
    case "edit":
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
        </svg>
      );
    case "star":
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      );
    case "chat":
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
        </svg>
      );
    default:
      return null;
  }
}

interface TemplateCardProps {
  template: TemplateDefinition;
  onSelect: (id: AITemplateId) => void;
}

export default function TemplateCard({ template, onSelect }: TemplateCardProps) {
  const iconClass = ICON_CLASSES[template.accent] ?? ICON_CLASSES.purple;
  const borderClass = BORDER_CLASSES[template.accent] ?? BORDER_CLASSES.purple;
  const tagClass = TAG_CLASSES[template.accent] ?? TAG_CLASSES.purple;

  return (
    <button
      onClick={() => onSelect(template.id)}
      className={`group w-full text-left p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 ${borderClass} hover:shadow-lg transition-all`}
    >
      <div
        className={`w-12 h-12 rounded-xl ${iconClass} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
      >
        <TemplateIcon type={template.iconType} />
      </div>
      <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
        {template.title}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
        {template.description}
      </p>
      <div className="flex gap-2 flex-wrap">
        {template.tags.map((tag) => (
          <span
            key={tag}
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tagClass}`}
          >
            {tag}
          </span>
        ))}
      </div>
    </button>
  );
}

"use client";

import { User, MessageCircle, CheckCheck, ClipboardList, Star } from "lucide-react";

// ── Data ──────────────────────────────────────────────────────────────────────

const CARDS = [
  {
    id: "free-conversation",
    title: "Free Conversation",
    desc: "Talk freely about any topic.",
    colorVar: "var(--primary)",
    hoverBorder: "hover:border-[var(--primary)]",
    Icon: MessageCircle,
    prompt: "Let's have a free conversation in English. I want to practice my speaking skills.",
  },
  {
    id: "sentence-correction",
    title: "Correct My Sentences",
    desc: "Write and get corrections.",
    colorVar: "var(--success)",
    hoverBorder: "hover:border-[var(--success)]",
    Icon: CheckCheck,
    prompt: "Please correct the following text and explain each correction: ",
  },
  {
    id: "practice-questions",
    title: "Practice Questions",
    desc: "Answer questions to expand thinking.",
    colorVar: "var(--error)",
    hoverBorder: "hover:border-[var(--error)]",
    Icon: ClipboardList,
    prompt: "Ask me practice questions to improve my English. Vary the topics and difficulty.",
  },
  {
    id: "personalized-practice",
    title: "Personalized",
    desc: "Practice based on your goals.",
    colorVar: "var(--warning)",
    hoverBorder: "hover:border-[var(--warning)]",
    Icon: Star,
    prompt: "Give me a personalized English practice session based on my level and goals.",
  },
];

const SUGGESTION_CHIPS = [
  { label: "🌍 Travel vocabulary", prompt: "Let's practice travel vocabulary. Give me useful phrases and words for traveling." },
  { label: "💼 Job interview",     prompt: "Help me prepare for a job interview in English. Ask me common interview questions." },
  { label: "📰 Read an article",   prompt: "Let's read and discuss an article together. Choose an interesting topic." },
  { label: "🎙️ Pronunciation",     prompt: "Let's work on my English pronunciation. Start with the sounds I might find difficult." },
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface ChatEmptyStateProps {
  onSendMessage: (text: string) => void;
  onChipSelect: (prompt: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ChatEmptyState({ onSendMessage, onChipSelect }: ChatEmptyStateProps) {
  return (
    <div className="flex-1 min-h-full flex flex-col items-center justify-center px-6 pt-8 pb-4">

      {/* Hero */}
      <div className="flex flex-col items-center gap-4 text-center mb-6">
        <div className="relative shrink-0">
          <div className="size-12 rounded-[14px] bg-[var(--gradient-primary)] flex items-center justify-center">
            <User size={22} strokeWidth={1.8} color="white" />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-[var(--success)] border-2 border-[var(--card-bg)]" />
        </div>
        <div>
          <p className="text-xl font-semibold text-[var(--text-primary)] leading-[1.3] m-0">
            Hi! I&apos;m your{" "}
            <em className="italic text-[var(--primary)]">English Coach.</em>
          </p>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">What would you like to practice?</p>
        </div>
      </div>

      {/* Quick-start cards */}
      <div className="grid grid-cols-2 gap-[10px] w-full mb-3">
        {CARDS.map(({ id, title, desc, colorVar, hoverBorder, Icon, prompt }) => (
          <button
            key={id}
            onClick={() => onSendMessage(prompt)}
            className={`p-[14px] rounded-[14px] bg-[var(--surface-raised)] border border-[var(--border-subtle)] text-left cursor-pointer transition-[transform,border-color] duration-150 flex flex-col items-start hover:-translate-y-px ${hoverBorder}`}
          >
            <Icon size={18} strokeWidth={1.8} style={{ color: colorVar }} />
            <span className="text-[13px] font-medium text-[var(--text-primary)] mt-2 leading-[1.3]">{title}</span>
            <span className="text-[11px] text-[var(--text-tertiary)] mt-0.5 leading-[1.4]">{desc}</span>
          </button>
        ))}
      </div>

      {/* Suggestion chips */}
      <div className="w-full flex gap-1.5 overflow-x-auto [scrollbar-width:none] pb-1">
        {SUGGESTION_CHIPS.map(({ label, prompt }) => (
          <button
            key={label}
            onClick={() => onChipSelect(prompt)}
            className="shrink-0 px-3 py-1.5 rounded-full bg-[var(--surface-raised)] border border-[var(--border-subtle)] text-xs text-[var(--text-tertiary)] whitespace-nowrap cursor-pointer transition-[border-color,color,background] duration-150 hover:border-[var(--accent-border)] hover:text-[var(--primary)] hover:bg-[var(--accent-dim)]"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

"use client";

import { MessageCircle, CheckCheck, ClipboardList, Star, ArrowUpRight, Plane, BriefcaseBusiness, AlignLeft, Mic } from "lucide-react";
import { AI_COACH_EMPTY_STATE_PROMPTS } from "@/lib/ai-prompts";

// ── Data ──────────────────────────────────────────────────────────────────────

const CARDS = [
  {
    id: "free-conversation",
    title: "Free Conversation",
    desc: "Chat about anything, no script needed.",
    colorVar: "var(--primary)",
    hoverBorder: "hover:border-[var(--primary)]",
    Icon: MessageCircle,
    prompt: AI_COACH_EMPTY_STATE_PROMPTS.freeConversation,
  },
  {
    id: "sentence-correction",
    title: "Correct My Sentences",
    desc: "Write something, get feedback instantly.",
    colorVar: "var(--success)",
    hoverBorder: "hover:border-[var(--success)]",
    Icon: CheckCheck,
    prompt: AI_COACH_EMPTY_STATE_PROMPTS.sentenceCorrection,
  },
  {
    id: "practice-questions",
    title: "Practice Questions",
    desc: "Thought-provoking questions to expand your English.",
    colorVar: "var(--error)",
    hoverBorder: "hover:border-[var(--error)]",
    Icon: ClipboardList,
    prompt: AI_COACH_EMPTY_STATE_PROMPTS.practiceQuestions,
  },
  {
    id: "personalized-practice",
    title: "Personalized",
    desc: "Practice based on your goals.",
    colorVar: "var(--warning)",
    hoverBorder: "hover:border-[var(--warning)]",
    Icon: Star,
    prompt: AI_COACH_EMPTY_STATE_PROMPTS.personalizedPractice,
  },
];

const SUGGESTION_CHIPS = [
  {
    label: "Trip to New York",
    Icon: Plane,
    prompt: AI_COACH_EMPTY_STATE_PROMPTS.newYorkTrip,
  },
  {
    label: "Job interview",
    Icon: BriefcaseBusiness,
    prompt: AI_COACH_EMPTY_STATE_PROMPTS.jobInterview,
  },
  {
    label: "Discuss an article",
    Icon: AlignLeft,
    prompt: AI_COACH_EMPTY_STATE_PROMPTS.discussArticle,
  },
  {
    label: "Pronunciation",
    Icon: Mic,
    prompt: AI_COACH_EMPTY_STATE_PROMPTS.pronunciation,
  },
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface ChatEmptyStateProps {
  onSendMessage: (text: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ChatEmptyState({ onSendMessage }: ChatEmptyStateProps) {
  return (
    <div className="flex-1 min-h-full flex flex-col items-center px-5 pt-10 pb-6 chat-bg">
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />
      <div className="blob blob-4" />

      {/* Hero */}
      <div className="flex flex-col items-center gap-4 text-center mb-8 w-full">
        <div
          className="relative size-14 rounded-2xl flex items-center justify-center shrink-0"
          style={{
            background: "var(--gradient-primary)",
            boxShadow: "0 8px 24px -8px color-mix(in srgb, var(--primary) 50%, transparent)",
          }}
        >
          <span className="text-white text-xl leading-none">✦</span>
          <span
            className="absolute inset-0 rounded-2xl"
            style={{ boxShadow: "inset 0 1px 0 0 rgb(255 255 255 / 0.25)" }}
          />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] m-0">
            Let's practice together.
          </h2>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Pick a mode or shortcut below to start.
          </p>
        </div>
      </div>

      {/* Quick-start cards */}
      <div className="grid grid-cols-2 gap-3 w-full mb-8">
        {CARDS.map(({ id, title, desc, colorVar, hoverBorder, Icon, prompt }) => (
          <button
            key={id}
            onClick={() => onSendMessage(prompt)}
            className={`group relative p-5 rounded-2xl bg-[var(--surface-raised)] border border-[var(--border-subtle)] text-left cursor-pointer transition-[transform,border-color,box-shadow] duration-200 flex flex-col items-start hover:-translate-y-0.5 hover:shadow-md ${hoverBorder}`}
          >
            <span
              className="absolute top-3.5 right-3.5 size-7 rounded-full flex items-center justify-center opacity-0 -translate-x-1 transition-[opacity,transform] duration-200 group-hover:opacity-100 group-hover:translate-x-0"
              style={{ backgroundColor: `color-mix(in srgb, ${colorVar} 14%, transparent)` }}
            >
              <ArrowUpRight size={14} strokeWidth={2.2} style={{ color: colorVar }} />
            </span>

            <span
              className="size-10 rounded-xl flex items-center justify-center mb-3.5 transition-transform duration-200 group-hover:scale-105"
              style={{
                backgroundColor: `color-mix(in srgb, ${colorVar} 14%, transparent)`,
                boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${colorVar} 18%, transparent)`,
              }}
            >
              <Icon size={19} strokeWidth={2} style={{ color: colorVar }} />
            </span>
            <span className="font-semibold text-[var(--text-primary)] leading-[1.3] text-[15px]">{title}</span>
            <span className="text-[13px] text-[var(--text-tertiary)] mt-1.5 leading-snug">{desc}</span>
          </button>
        ))}
      </div>

      {/* Suggestion chips */}
      <div className="w-full flex items-center gap-2.5 mb-3">
        <span className="h-px flex-1 bg-[var(--border-subtle)]" />
        <p className="text-[10px] font-semibold tracking-[0.14em] text-[var(--text-tertiary)] uppercase">
          Popular Shortcuts
        </p>
        <span className="h-px flex-1 bg-[var(--border-subtle)]" />
      </div>
      <div className="w-full flex gap-2 overflow-x-auto [scrollbar-width:none] pb-1">
        {SUGGESTION_CHIPS.map(({ label, Icon, prompt }) => (
          <button
            key={label}
            onClick={() => onSendMessage(prompt)}
            className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[var(--surface-raised)] border border-[var(--border-subtle)] text-caption font-medium text-[var(--text-secondary)] whitespace-nowrap cursor-pointer transition-[border-color,color,background,transform] duration-150 hover:border-[var(--accent-border)] hover:text-[var(--primary)] hover:bg-[var(--accent-dim)] hover:-translate-y-px"
          >
            <Icon size={13} strokeWidth={2} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

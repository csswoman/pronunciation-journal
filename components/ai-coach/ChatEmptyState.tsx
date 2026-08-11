"use client";

import {
  MessageCircle,
  CheckCheck,
  ClipboardList,
  Star,
  ArrowUpRight,
  Plane,
  BriefcaseBusiness,
  AlignLeft,
  Mic,
  Sparkles,
} from "@/components/icons";
import { AI_COACH_EMPTY_STATE_PROMPTS } from "@/lib/ai-prompts";
import { cn } from "@/lib/cn";

// Planned structure:
// <ChatEmptyState>
//   <EmptyHero />
//   <ModeList> — primary quick-starts (stacked rows)
//   <ShortcutRail /> — secondary chips
// </ChatEmptyState>

const CARDS = [
  {
    id: "free-conversation",
    title: "Free Conversation",
    desc: "Chat about anything, no script needed.",
    colorVar: "var(--primary)",
    Icon: MessageCircle,
    prompt: AI_COACH_EMPTY_STATE_PROMPTS.freeConversation,
  },
  {
    id: "sentence-correction",
    title: "Correct My Sentences",
    desc: "Write something, get feedback instantly.",
    colorVar: "var(--success)",
    Icon: CheckCheck,
    prompt: AI_COACH_EMPTY_STATE_PROMPTS.sentenceCorrection,
  },
  {
    id: "practice-questions",
    title: "Practice Questions",
    desc: "Thought-provoking questions to expand your English.",
    colorVar: "var(--error)",
    Icon: ClipboardList,
    prompt: AI_COACH_EMPTY_STATE_PROMPTS.practiceQuestions,
  },
  {
    id: "personalized-practice",
    title: "Personalized",
    desc: "Practice based on your goals.",
    colorVar: "var(--warning)",
    Icon: Star,
    prompt: AI_COACH_EMPTY_STATE_PROMPTS.personalizedPractice,
  },
] as const;

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
] as const;

interface ChatEmptyStateProps {
  onSendMessage: (text: string) => void;
}

export default function ChatEmptyState({ onSendMessage }: ChatEmptyStateProps) {
  return (
    <div className="@container relative flex min-h-full flex-1 flex-col justify-center chat-bg">
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />
      <div className="blob blob-4" />

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-col px-3 py-6 @[22rem]:px-4 @[22rem]:py-8">
        {/* Hero — compact so modes enter the first viewport */}
        <header className="mb-5 flex flex-col items-center gap-2.5 text-center @[22rem]:mb-6">
          <div
            className="relative flex size-11 shrink-0 items-center justify-center rounded-lg @[22rem]:size-12 @[22rem]:rounded-xl"
            style={{
              background: "var(--gradient-primary)",
              boxShadow:
                "0 8px 24px -8px color-mix(in oklch, var(--primary) 45%, transparent)",
            }}
          >
            <Sparkles size={20} strokeWidth={1.75} className="text-on-primary" aria-hidden />
            <span className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_1px_0_0_rgb(255_255_255_/_0.25)]" />
          </div>
          <div className="layout-stack-tight max-w-prose">
            <h2 className="m-0 text-balance text-h3 text-fg">
              Let&apos;s practice together.
            </h2>
            <p className="m-0 text-pretty text-caption leading-relaxed text-fg-muted">
              Pick a mode or shortcut below to start.
            </p>
          </div>
        </header>

        {/* Primary modes — stacked rows beat a cramped 2×2 in the coach panel */}
        <section aria-label="Practice modes" className="layout-stack-tight w-full">
          {CARDS.map(({ id, title, desc, colorVar, Icon, prompt }) => (
            <button
              key={id}
              type="button"
              onClick={() => onSendMessage(prompt)}
              className={cn(
                "group layout-card-pad-compact flex w-full min-h-11 items-center gap-3 rounded-md",
                "border border-border-subtle bg-surface-raised text-left cursor-pointer",
                "transition-[border-color,background-color,transform] duration-150 ease-out",
                "hover:border-border-default hover:bg-surface-base",
                "active:scale-[0.99] focus-ring motion-reduce:transition-none motion-reduce:active:scale-100",
              )}
            >
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-md"
                style={{
                  backgroundColor: `color-mix(in oklch, ${colorVar} 14%, transparent)`,
                  boxShadow: `inset 0 0 0 1px color-mix(in oklch, ${colorVar} 18%, transparent)`,
                  color: colorVar,
                }}
              >
                <Icon size={18} strokeWidth={2} aria-hidden />
              </span>

              <span className="layout-stack-tight min-w-0 flex-1">
                <span className="block text-body-sm font-semibold leading-snug text-fg">
                  {title}
                </span>
                <span className="block text-pretty text-caption leading-snug text-fg-subtle">
                  {desc}
                </span>
              </span>

              <ArrowUpRight
                size={16}
                strokeWidth={2}
                className="shrink-0 text-fg-subtle transition-colors duration-150 group-hover:text-fg-muted motion-reduce:transition-none"
                aria-hidden
              />
            </button>
          ))}
        </section>

        {/* Secondary shortcuts — more air above, tighter within */}
        <section aria-label="Popular shortcuts" className="mt-6 w-full @[22rem]:mt-7">
          <div className="mb-2.5 flex items-center gap-2.5">
            <span className="h-px flex-1 bg-border-subtle" />
            <p className="m-0 font-kicker text-fg-subtle">Popular Shortcuts</p>
            <span className="h-px flex-1 bg-border-subtle" />
          </div>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {SUGGESTION_CHIPS.map(({ label, Icon, prompt }) => (
              <button
                key={label}
                type="button"
                onClick={() => onSendMessage(prompt)}
                className={cn(
                  "flex min-h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-border-subtle",
                  "bg-surface-raised px-3.5 text-caption font-medium whitespace-nowrap text-fg-muted",
                  "transition-colors duration-150 focus-ring",
                  "hover:border-primary hover:bg-primary-soft hover:text-primary",
                  "active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100",
                )}
              >
                <Icon size={14} strokeWidth={2} className="shrink-0" aria-hidden />
                {label}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

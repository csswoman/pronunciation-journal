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
    title: "Conversación libre",
    desc: "Habla de cualquier tema, sin guion.",
    colorVar: "var(--primary)",
    Icon: MessageCircle,
    prompt: AI_COACH_EMPTY_STATE_PROMPTS.freeConversation,
  },
  {
    id: "sentence-correction",
    title: "Corrige mis oraciones",
    desc: "Escribe algo y recibe comentarios al instante.",
    colorVar: "var(--success)",
    Icon: CheckCheck,
    prompt: AI_COACH_EMPTY_STATE_PROMPTS.sentenceCorrection,
  },
  {
    id: "practice-questions",
    title: "Preguntas de práctica",
    desc: "Preguntas para reflexionar y ampliar tu inglés.",
    colorVar: "var(--error)",
    Icon: ClipboardList,
    prompt: AI_COACH_EMPTY_STATE_PROMPTS.practiceQuestions,
  },
  {
    id: "personalized-practice",
    title: "Personalizado",
    desc: "Práctica adaptada a tus objetivos.",
    colorVar: "var(--warning)",
    Icon: Star,
    prompt: AI_COACH_EMPTY_STATE_PROMPTS.personalizedPractice,
  },
] as const;

const SUGGESTION_CHIPS = [
  {
    label: "Viaje a Nueva York",
    Icon: Plane,
    prompt: AI_COACH_EMPTY_STATE_PROMPTS.newYorkTrip,
  },
  {
    label: "Entrevista de trabajo",
    Icon: BriefcaseBusiness,
    prompt: AI_COACH_EMPTY_STATE_PROMPTS.jobInterview,
  },
  {
    label: "Comentar un artículo",
    Icon: AlignLeft,
    prompt: AI_COACH_EMPTY_STATE_PROMPTS.discussArticle,
  },
  {
    label: "Pronunciación",
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
        {/* Hero — avatar prominente */}
        <header className="mb-5 flex flex-col items-center gap-3 text-center @[22rem]:mb-6">
          <div className="relative flex size-16 shrink-0 items-center justify-center rounded-full bg-gradient-primary text-on-primary shadow-lg shadow-primary/25">
            <Sparkles size={32} strokeWidth={2} />
            <span className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_0_1px_0_0_rgb(255_255_255_/_0.35)]" />
          </div>
          <div className="layout-stack-tight max-w-prose">
            <h2 className="m-0 flex items-center justify-center gap-2 text-balance text-h3 text-fg font-semibold tracking-tight">
              ¡Hola! ¿De qué te gustaría hablar hoy?
            </h2>
            <p className="m-0 text-pretty text-caption leading-relaxed text-fg-muted">
              Elige una opción para romper el hielo o escribe tu mensaje abajo.
            </p>
          </div>
        </header>

        {/* Primary modes — stacked rows beat a cramped 2×2 in the coach panel */}
        <section aria-label="Modos de práctica" className="layout-stack-tight w-full">
          {CARDS.map(({ id, title, desc, colorVar, Icon, prompt }) => (
            <button
              key={id}
              type="button"
              onClick={() => onSendMessage(prompt)}
              className={cn(
                "group layout-card-pad-compact flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-md",
                "border border-border-subtle bg-surface-raised text-left",
                "transition-[border-color,background-color,transform] duration-150 ease-out",
                "hover:border-border-default hover:bg-surface-base",
                "focus-ring active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100",
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
        <section aria-label="Atajos populares" className="mt-6 w-full @[22rem]:mt-7">
          <div className="mb-2.5 flex items-center gap-2.5">
            <span className="h-px flex-1 bg-border-subtle" />
            <p className="m-0 font-kicker text-fg-subtle">Atajos populares</p>
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

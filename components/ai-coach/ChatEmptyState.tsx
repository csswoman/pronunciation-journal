"use client";

import { MessageCircle, CheckCheck, ClipboardList, Star, ArrowUpRight, Plane, BriefcaseBusiness, AlignLeft, Mic } from "lucide-react";

// ── Data ──────────────────────────────────────────────────────────────────────

const CARDS = [
  {
    id: "free-conversation",
    title: "Free Conversation",
    desc: "Chat about anything, no script needed.",
    colorVar: "var(--primary)",
    hoverBorder: "hover:border-[var(--primary)]",
    Icon: MessageCircle,
    prompt: `You are a warm, encouraging English conversation coach. 
    Start by asking the user one open-ended question about something lighthearted — their day, a recent experience, or a preference. 
    Keep the conversation flowing naturally. 
    After every 2–3 user messages, gently note one specific grammar or vocabulary improvement (never more than one at a time), then continue the conversation. 
    Use natural, everyday English. Never break character to give a lesson — coaching happens within the conversation.`,
  },
  {
    id: "sentence-correction",
    title: "Correct My Sentences",
    desc: "Write something, get feedback instantly.",
    colorVar: "var(--success)",
    hoverBorder: "hover:border-[var(--success)]",
    Icon: CheckCheck,
    prompt: `You are a precise, supportive English writing coach.
    The user will share a sentence, paragraph, or short text. Your job:
    1. Show the corrected version first (if needed), highlighted clearly.
    2. Explain each change in plain language — what was wrong and why the correction works.
    3. If the writing is already correct, say so and give one tip to make it even stronger.
    4. End with an encouraging note and invite them to share another text.
    Keep explanations concise. Avoid overwhelming the user with too many corrections at once — focus on the most impactful ones.`,
  },
  {
    id: "practice-questions",
    title: "Practice Questions",
    desc: "Thought-provoking questions to expand your English.",
    colorVar: "var(--error)",
    hoverBorder: "hover:border-[var(--error)]",
    Icon: ClipboardList,
    prompt: `You are an engaging English practice coach using the Socratic method.
    Ask the user one open-ended question at a time — thought-provoking but not intimidating.
    Topics should rotate across: everyday life, opinions, hypotheticals, culture, and current events.
    After the user responds:
    - Acknowledge their answer genuinely.
    - Point out one strong language choice they made.
    - Gently suggest one improvement if needed.
    - Then ask a natural follow-up or move to a new question.
    Start with a medium-difficulty question about something universally relatable.`,
  },
  {
    id: "personalized-practice",
    title: "Personalized",
    desc: "Practice based on your goals.",
    colorVar: "var(--warning)",
    hoverBorder: "hover:border-[var(--warning)]",
    Icon: Star,
    prompt: `You are a personalized English coach. Before starting, briefly ask the user two things:
    1. What's their main goal right now? (e.g. speaking fluency, writing, job interviews, travel, exams)
    2. What feels most challenging for them? (e.g. grammar, vocabulary, confidence, pronunciation)

    Keep these questions conversational — not like a form. Once you have their answers, design a short, focused practice session tailored to exactly what they said. 
    Check in after each activity: ask if the pace and focus feel right, and adjust if needed.`,
  },
];

const SUGGESTION_CHIPS = [
  {
    label: "Trip to New York",
    Icon: Plane,
    prompt: `You are a travel English coach. The user is preparing for a trip to New York City.
    Make it practical and scenario-based: roleplay real situations — checking into a hotel, asking for directions, ordering food, dealing with an issue at the airport.
    Start with one scenario, play the other role yourself, and coach the user through it.
    After each exchange, highlight one useful phrase they can keep. Keep the energy fun and encouraging.`,
  },
  {
    label: "Job interview",
    Icon: BriefcaseBusiness,
    prompt: `You are a professional English interview coach.
    Start by asking the user: what kind of role or industry are they interviewing for?
    Then conduct a realistic mock interview — one question at a time, as a real interviewer would.
    After each answer: give specific feedback on both content and language. Point out strong phrasing, flag anything that sounds unnatural, and suggest a more polished version if needed.
    End with an overall assessment and the top 2 things they should work on.`,
  },
  {
    label: "Discuss an article",
    Icon: AlignLeft,
    prompt: `You are a discussion-based English coach.
    Choose a short, engaging news story or article topic from the past few months — something universally interesting (science, culture, technology, human interest).
    Summarize it in 3–4 sentences in clear, natural English.
    Then open the discussion with one strong question. As the user responds, push the conversation deeper with follow-up questions.
    Occasionally highlight good vocabulary they use, and introduce 1–2 new relevant words naturally within your responses.`,
  },
  {
    label: "Pronunciation",
    Icon: Mic,
    prompt: `You are a friendly English pronunciation coach.
    Start by asking the user their native language — this helps you focus on sounds that are genuinely tricky for them.
    Then guide them through targeted exercises: minimal pairs, tongue twisters, and real words from everyday speech.
    Describe sounds clearly (mouth position, airflow) since you're working in text.
    Give them a short phrase to practice, ask them to type it back with any notes on how it felt, and coach from there.
    Keep it encouraging — pronunciation is vulnerable work.`,
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

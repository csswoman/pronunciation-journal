"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  User, MessageCircle,
  CheckCheck, ClipboardList,
  Star, Laptop, Layers,
} from "lucide-react";
import type { TabId } from "@/components/ai-practice/ChatTabs";
import CustomPromptPanel from "@/components/ai-practice/CustomPromptPanel";
import s from "./AICoachHome.module.css";

// ── Types ─────────────────────────────────────────────────────────────────────

type Scenario = "hr" | "frontend" | "system-design" | "behavioral";
type Level = "beginner" | "intermediate" | "advanced";
type Difficulty = "guided" | "challenge";

// ── Chat quick-start cards ────────────────────────────────────────────────────

const CARDS = [
  {
    id: "free-conversation",
    title: "Free Conversation",
    desc: "Talk freely about any topic.",
    colorVar: "var(--primary)",
    colorClass: s.cardPurple,
    Icon: MessageCircle,
    prompt: "Let's have a free conversation in English. I want to practice my speaking skills.",
  },
  {
    id: "sentence-correction",
    title: "Correct My Sentences",
    desc: "Write and get corrections.",
    colorVar: "var(--success)",
    colorClass: s.cardGreen,
    Icon: CheckCheck,
    prompt: "Please correct the following text and explain each correction: ",
  },
  {
    id: "practice-questions",
    title: "Practice Questions",
    desc: "Answer questions to expand thinking.",
    colorVar: "var(--error)",
    colorClass: s.cardRose,
    Icon: ClipboardList,
    prompt: "Ask me practice questions to improve my English. Vary the topics and difficulty.",
  },
  {
    id: "personalized-practice",
    title: "Personalized",
    desc: "Practice based on your goals.",
    colorVar: "var(--warning)",
    colorClass: s.cardAmber,
    Icon: Star,
    prompt: "Give me a personalized English practice session based on my level and goals.",
  },
];

const SUGGESTION_CHIPS = [
  { label: "🌍 Travel vocabulary", prompt: "Let's practice travel vocabulary. Give me useful phrases and words for traveling." },
  { label: "💼 Job interview", prompt: "Help me prepare for a job interview in English. Ask me common interview questions." },
  { label: "📰 Read an article", prompt: "Let's read and discuss an article together. Choose an interesting topic." },
  { label: "🎙️ Pronunciation", prompt: "Let's work on my English pronunciation. Start with the sounds I might find difficult." },
];

// ── Interview config ──────────────────────────────────────────────────────────

const INTERVIEW_TYPES: { id: Scenario; label: string; sub: string; Icon: React.ElementType }[] = [
  { id: "hr",            label: "HR / General",   sub: "Tell me about yourself…",    Icon: User },
  { id: "frontend",      label: "Frontend Dev",   sub: "React, CSS, JS concepts",    Icon: Laptop },
  { id: "system-design", label: "System Design",  sub: "Architecture, trade-offs",   Icon: Layers },
  { id: "behavioral",    label: "Behavioral",     sub: "STAR method",                Icon: Star },
];

const LEVELS: { id: Level; label: string; sub: string }[] = [
  { id: "beginner",     label: "Beginner",     sub: "Simple vocabulary" },
  { id: "intermediate", label: "Intermediate", sub: "Professional language" },
  { id: "advanced",     label: "Advanced",     sub: "Native-level fluency" },
];

const SCORING: { id: Difficulty; label: string; badge: string; badgeClass: string; sub: string }[] = [
  { id: "guided",    label: "Guided",    badge: "Easier", badgeClass: s.badgeGreen, sub: "Lenient — build confidence" },
  { id: "challenge", label: "Challenge", badge: "Harder", badgeClass: s.badgeAmber, sub: "Strict — push your limits" },
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface AICoachHomeProps {
  activeTab: TabId;
  onSendMessage: (text: string) => void;
  isStreaming: boolean;
  prefill?: string;
  onPrefillConsumed?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AICoachHome({
  activeTab,
  onSendMessage,
  isStreaming,
  prefill,
  onPrefillConsumed,
}: AICoachHomeProps) {
  const router = useRouter();

  const [chipPrefill, setChipPrefill] = useState<string | undefined>(undefined);

  const [scenario, setScenario] = useState<Scenario>("hr");
  const [level, setLevel] = useState<Level>("intermediate");
  const [difficulty, setDifficulty] = useState<Difficulty>("guided");

  const isInterview = activeTab === "interview";

  function startInterview() {
    sessionStorage.setItem("interviewConfig", JSON.stringify({ scenario, level, difficulty }));
    router.push("/interview");
  }

  return (
    <div className={s.root}>

      {/* ── Scrollable content ─────────────────────────────────────────── */}
      <div className={s.content}>

        {isInterview ? (
          /* ── Interview config ──────────────────────────────────────── */
          <div className={s.interviewConfig}>
            <div className={s.interviewSection}>
              <p className={s.sectionLabel}>Interview Type</p>
              <div className={s.interviewCards}>
                {INTERVIEW_TYPES.map(({ id, label, sub, Icon }) => (
                  <button
                    key={id}
                    onClick={() => setScenario(id)}
                    className={`${s.interviewCard} ${scenario === id ? s.interviewCardActive : ""}`}
                  >
                    <Icon
                      size={16}
                      strokeWidth={1.8}
                      style={{ color: scenario === id ? "var(--primary)" : "var(--text-tertiary)" }}
                    />
                    <span className={s.interviewCardLabel}>{label}</span>
                    <span className={s.interviewCardSub}>{sub}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className={s.interviewSection}>
              <p className={s.sectionLabel}>Your English Level</p>
              <div className={s.levelPills}>
                {LEVELS.map(({ id, label, sub }) => (
                  <button
                    key={id}
                    onClick={() => setLevel(id)}
                    className={`${s.levelPill} ${level === id ? s.levelPillActive : ""}`}
                  >
                    <span className={s.levelPillLabel}>{label}</span>
                    <span className={s.levelPillSub}>{sub}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className={s.interviewSection}>
              <p className={s.sectionLabel}>Scoring Mode</p>
              <div className={s.interviewCards}>
                {SCORING.map(({ id, label, badge, badgeClass, sub }) => (
                  <button
                    key={id}
                    onClick={() => setDifficulty(id)}
                    className={`${s.interviewCard} ${difficulty === id ? s.interviewCardActive : ""}`}
                  >
                    <div className={s.interviewCardRow}>
                      <span className={s.interviewCardLabel}>{label}</span>
                      <span className={`${s.interviewBadge} ${badgeClass}`}>{badge}</span>
                    </div>
                    <span className={s.interviewCardSub}>{sub}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ── Chat empty state — centered ───────────────────────────── */
          <div className={s.chatEmpty}>
            {/* Hero: avatar + heading */}
            <div className={s.hero}>
              <div className={s.avatar}>
                <div className={s.avatarGradient}>
                  <User size={22} strokeWidth={1.8} color="white" />
                </div>
                <span className={s.statusDot} />
              </div>
              <div>
                <p className={s.coachHeading}>
                  Hi! I&apos;m your{" "}
                  <em className={s.coachAccent}>English Coach.</em>
                </p>
                <p className={s.coachSub}>What would you like to practice?</p>
              </div>
            </div>

            {/* Quick-start cards */}
            <div className={s.cards}>
              {CARDS.map(({ id, title, desc, colorVar, colorClass, Icon, prompt }) => (
                <button
                  key={id}
                  onClick={() => onSendMessage(prompt)}
                  className={`${s.card} ${colorClass}`}
                >
                  <Icon size={18} strokeWidth={1.8} style={{ color: colorVar }} />
                  <span className={s.cardTitle}>{title}</span>
                  <span className={s.cardDesc}>{desc}</span>
                </button>
              ))}
            </div>

            {/* Suggestion chips */}
            <div className={s.chips}>
              {SUGGESTION_CHIPS.map(({ label, prompt }) => (
                <button key={label} onClick={() => setChipPrefill(prompt)} className={s.chip}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Fixed bottom ───────────────────────────────────────────────── */}
      {isInterview ? (
        <div className={s.ctaWrap}>
          <button className={s.ctaBtn} onClick={startInterview}>
            Start Interview →
          </button>
        </div>
      ) : (
        <div className={s.inputArea}>
          <CustomPromptPanel
            onSubmit={onSendMessage}
            isDisabled={isStreaming}
            variant="chat"
            placeholder="Ask your English Coach..."
            prefill={chipPrefill ?? prefill}
            onPrefillConsumed={() => { setChipPrefill(undefined); onPrefillConsumed?.(); }}
          />
        </div>
      )}
    </div>
  );
}

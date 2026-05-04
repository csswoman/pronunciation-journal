"use client";

import { CheckCheck } from "lucide-react";
import type { AIMessage, ExerciseResult } from "@/lib/ai-practice/types";
import AIAvatar from "./AIAvatar";
import SuggestionChips from "./SuggestionChips";
import ToolWidget from "./chat/ToolWidget";

// ── Inline markdown renderer ──────────────────────────────────────────────────

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`)/g);
  return parts.map((part, i) => {
    if ((part.startsWith("**") && part.endsWith("**")) || (part.startsWith("__") && part.endsWith("__"))) {
      return <strong key={i} style={{ color: "var(--text-primary)" }}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code key={i} className="px-1 py-0.5 rounded text-xs font-mono"
          style={{ backgroundColor: "var(--btn-regular-bg)", color: "var(--text-primary)" }}>
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function renderProse(lines: string[]) {
  const elements: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }

    if (/^[-*•]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*•]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*•]\s+/, ""));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="space-y-0.5 pl-3">
          {items.map((item, j) => (
            <li key={j} className="flex gap-2 text-sm leading-relaxed">
              <span className="mt-2 w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: "var(--text-tertiary)" }} />
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    if (/^#{1,3}\s+/.test(line)) {
      elements.push(
        <p key={`h-${i}`} className="text-xs font-semibold uppercase tracking-wider mt-2" style={{ color: "var(--text-tertiary)" }}>
          {renderInline(line.replace(/^#{1,3}\s+/, ""))}
        </p>
      );
      i++;
      continue;
    }

    elements.push(
      <p key={`p-${i}`} className="text-sm leading-relaxed">{renderInline(line)}</p>
    );
    i++;
  }
  return elements;
}

function formatTime(date: Date | string | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function extractSentenceContext(fullText: string, selected: string): string {
  const sentences = fullText.split(/(?<=[.!?])\s+/);
  const match = sentences.find(s => s.toLowerCase().includes(selected.toLowerCase()));
  return match?.trim() || selected;
}

function extractSuggestions(text: string): string[] {
  const match = text.match(/suggestions?:\s*([\s\S]*?)(?:\n\n|$)/i);
  if (!match) return [];
  return match[1]
    .split("\n")
    .map(l => l.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean);
}

// ── AI bubble ─────────────────────────────────────────────────────────────────

interface AIBubbleProps {
  message: Extract<AIMessage, { role: "model" }>;
  onSaveWord: (word: string, context: string) => void;
  onSuggestionClick: (text: string) => void;
  onToolAnswer: (callId: string, result: ExerciseResult) => void;
  onNext: () => void;
}

function AIBubble({ message, onSaveWord, onSuggestionClick, onToolAnswer, onNext }: AIBubbleProps) {
  const fullText = message.contentParts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map(p => p.text)
    .join("\n");

  const hasSuggestions = message.contentParts.some(
    p => p.type === "text" && /^suggestions?:/im.test(p.text)
  );

  const handleMouseUp = () => {
    const selected = window.getSelection()?.toString().trim();
    if (selected && selected.length >= 2 && selected.split(/\s+/).length <= 4) {
      onSaveWord(selected, extractSentenceContext(fullText, selected));
    }
  };

  return (
    <div className="flex justify-start gap-2.5 group/msg">
      <AIAvatar />
      <div className="flex flex-col gap-2 flex-1 min-w-0 max-w-[85%]">
        <div
          className="px-4 py-3 rounded-2xl rounded-tl-md border"
          style={{
            backgroundColor: "var(--card-bg)",
            borderColor: "var(--line-divider)",
          }}
        >
          <div
            className="space-y-1.5 text-body-sm leading-relaxed cursor-text select-text"
            style={{ color: "var(--text-secondary)" }}
            onMouseUp={handleMouseUp}
          >
            {message.contentParts.map((part, i) => {
              if (part.type === "text") {
                return <div key={i}>{renderProse(part.text.split("\n"))}</div>;
              }
              const tc = message.toolCalls.get(part.callId);
              if (!tc || tc.name === "suggestions") return null;
              return (
                <ToolWidget key={i} toolCall={tc} onAnswer={onToolAnswer} onNext={onNext} />
              );
            })}
          </div>
        </div>

        <p
          className="text-tiny pl-1 opacity-0 group-hover/msg:opacity-100 transition-opacity"
          style={{ color: "var(--text-tertiary)" }}
        >
          {formatTime((message as { createdAt?: Date }).createdAt)}
        </p>

        {hasSuggestions && (
          <SuggestionChips
            suggestions={extractSuggestions(fullText).map(s => ({ label: s, prompt: s }))}
            onSelect={onSuggestionClick}
          />
        )}
      </div>
    </div>
  );
}

// ── Public component ──────────────────────────────────────────────────────────

interface MessageBubbleProps {
  message: AIMessage;
  onSaveWord: (word: string, context: string) => void;
  onSuggestionClick: (text: string) => void;
  onToolAnswer: (callId: string, result: ExerciseResult) => void;
  onNext: () => void;
}

export default function MessageBubble({ message, onSaveWord, onSuggestionClick, onToolAnswer, onNext }: MessageBubbleProps) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end group/msg">
        <div className="flex flex-col items-end gap-1.5 max-w-[78%]">
          <div
            className="px-4 py-2.5 rounded-2xl rounded-tr-md text-body-sm leading-relaxed whitespace-pre-wrap break-words"
            style={{
              backgroundColor: "color-mix(in oklch, var(--primary) 12%, var(--card-bg))",
              color: "var(--text-primary)",
            }}
          >
            {message.content}
          </div>
          <div className="flex items-center gap-1 pr-1 opacity-0 group-hover/msg:opacity-100 transition-opacity">
            <span className="text-tiny" style={{ color: "var(--text-tertiary)" }}>
              {formatTime((message as { createdAt?: Date }).createdAt)}
            </span>
            <CheckCheck size={11} style={{ color: "var(--primary)" }} />
          </div>
        </div>
      </div>
    );
  }

  if (message.role === "tool") return null;

  return (
    <AIBubble
      message={message}
      onSaveWord={onSaveWord}
      onSuggestionClick={onSuggestionClick}
      onToolAnswer={onToolAnswer}
      onNext={onNext}
    />
  );
}

"use client";
import Button from "@/components/ui/Button";

import type { AIMessage } from "@/lib/types";
import AIAvatar from "./AIAvatar";
import SuggestionChips from "./SuggestionChips";

function extractSentenceContext(fullText: string, selected: string): string {
  const sentences = fullText.split(/(?<=[.!?])\s+/);
  const match = sentences.find((s) =>
    s.toLowerCase().includes(selected.toLowerCase())
  );
  return match?.trim() || selected;
}

// ── Structured section detection ─────────────────────────────────────────────
// AI messages may contain labelled sections we render with special styling.
// Recognised prefixes (case-insensitive): Correction:, Explanation:, Tip:,
// Suggestion(s):, Word(s):, Example(s):

type Section =
  | { kind: "correction"; text: string }
  | { kind: "explanation"; text: string }
  | { kind: "tip"; text: string }
  | { kind: "suggestions"; items: string[] }
  | { kind: "words"; items: string[] }
  | { kind: "prose"; lines: string[] };

const SECTION_LABELS: { pattern: RegExp; kind: Section["kind"] }[] = [
  { pattern: /^correction:/i, kind: "correction" },
  { pattern: /^explanation:/i, kind: "explanation" },
  { pattern: /^tip:/i, kind: "tip" },
  { pattern: /^suggestions?:/i, kind: "suggestions" },
  { pattern: /^words?:/i, kind: "words" },
];

function parseSections(content: string): Section[] {
  const rawLines = content.split("\n");
  const sections: Section[] = [];
  let currentKind: Section["kind"] | null = null;
  let buffer: string[] = [];

  const flush = () => {
    if (!buffer.length) return;
    const joined = buffer.join("\n").trim();
    if (!joined) return;

    if (currentKind === "suggestions" || currentKind === "words") {
      const items = joined
        .split("\n")
        .map((l) => l.replace(/^[-•*]\s*/, "").trim())
        .filter(Boolean);
      sections.push({ kind: currentKind, items } as Section);
    } else if (currentKind && currentKind !== "prose") {
      sections.push({ kind: currentKind, text: joined } as Section);
    } else {
      sections.push({ kind: "prose", lines: buffer.filter((l) => l.trim()) });
    }
    buffer = [];
  };

  for (const line of rawLines) {
    const match = SECTION_LABELS.find(({ pattern }) => pattern.test(line.trim()));
    if (match) {
      flush();
      currentKind = match.kind;
      const rest = line.replace(match.pattern, "").trim();
      if (rest) buffer.push(rest);
    } else {
      if (currentKind === null) currentKind = "prose";
      buffer.push(line);
    }
  }
  flush();
  return sections;
}

// ── Inline markdown renderer ──────────────────────────────────────────────────

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (
      (part.startsWith("**") && part.endsWith("**")) ||
      (part.startsWith("__") && part.endsWith("__"))
    ) {
      return (
        <strong key={i} style={{ color: "var(--text-primary)" }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code
          key={i}
          className="px-1 py-0.5 rounded text-xs font-mono"
          style={{ backgroundColor: "var(--btn-regular-bg)", color: "var(--text-primary)" }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

// ── Prose renderer (fallback for unstructured content) ────────────────────────

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
      <p key={`p-${i}`} className="text-sm leading-relaxed">
        {renderInline(line)}
      </p>
    );
    i++;
  }
  return elements;
}

// ── Section renderers ─────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--text-tertiary)" }}>
      {children}
    </p>
  );
}

function CorrectionSection({ text }: { text: string }) {
  return (
    <div
      className="px-3 py-2.5 rounded-lg border-l-2 text-sm leading-relaxed font-medium"
      style={{
        borderColor: "var(--primary)",
        backgroundColor: "var(--btn-regular-bg)",
        color: "var(--text-primary)",
      }}
    >
      {text}
    </div>
  );
}

function ExplanationSection({ text }: { text: string }) {
  return (
    <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
      {renderInline(text)}
    </p>
  );
}

function TipSection({ text }: { text: string }) {
  return (
    <div
      className="flex gap-2 items-start text-sm leading-relaxed"
      style={{ color: "var(--text-secondary)" }}
    >
      <span className="mt-0.5 text-xs opacity-60">💡</span>
      <span>{renderInline(text)}</span>
    </div>
  );
}

function SuggestionsSection({ items, onSuggestionClick }: { items: string[]; onSuggestionClick: (text: string) => void }) {
  const chips = items.map((item) => ({ label: item, prompt: item }));
  return <SuggestionChips suggestions={chips} onSelect={onSuggestionClick} />;
}

interface WordsProps {
  items: string[];
  onSaveWord: (word: string, context: string) => void;
  fullContent: string;
}

function WordsSection({ items, onSaveWord, fullContent }: WordsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => {
        const word = item.replace(/^[-•*]\s*/, "").trim();
        if (!word) return null;
        return (
          <Button
            key={i}
            onClick={() => onSaveWord(word, extractSentenceContext(fullContent, word))}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all"
            style={{
              backgroundColor: "var(--btn-regular-bg)",
              borderColor: "var(--line-divider)",
              color: "var(--text-secondary)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--primary)";
              e.currentTarget.style.color = "var(--primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--line-divider)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            <span style={{ color: "var(--text-primary)" }}>{word}</span>
            <span className="opacity-50">+ save</span>
          </Button>
        );
      })}
    </div>
  );
}

// ── AI bubble with structured sections ───────────────────────────────────────

interface AIBubbleProps {
  message: AIMessage;
  onSaveWord: (word: string, context: string) => void;
  onSuggestionClick: (text: string) => void;
}

function AIBubble({ message, onSaveWord, onSuggestionClick }: AIBubbleProps) {
  const sections = parseSections(message.content);
  const hasStructure = sections.some((s) => s.kind !== "prose");

  // Plain prose message — simpler render
  if (!hasStructure) {
    return (
      <div className="flex justify-start gap-3">
        <AIAvatar />
        <div
          className="flex-1 min-w-0 max-w-[85%] px-4 py-3 rounded-xl rounded-tl-none text-sm leading-relaxed space-y-1.5 cursor-text select-text"
          style={{ backgroundColor: "var(--btn-regular-bg)", color: "var(--text-secondary)" }}
          onMouseUp={() => {
            const selected = window.getSelection()?.toString().trim();
            if (selected && selected.length >= 2 && selected.split(/\s+/).length <= 4) {
              onSaveWord(selected, extractSentenceContext(message.content, selected));
            }
          }}
          title="Select a word to save it"
        >
          {renderProse(message.content.split("\n"))}
        </div>
      </div>
    );
  }

  // Structured message
  return (
    <div className="flex justify-start gap-3">
      <AIAvatar />
      <div className="flex-1 min-w-0 max-w-[85%] flex flex-col gap-3">
        {sections.map((section, i) => {
          switch (section.kind) {
            case "correction":
              return (
                <div key={i}>
                  <SectionLabel>Correction</SectionLabel>
                  <CorrectionSection text={section.text} />
                </div>
              );
            case "explanation":
              return (
                <div key={i}>
                  <SectionLabel>Explanation</SectionLabel>
                  <ExplanationSection text={section.text} />
                </div>
              );
            case "tip":
              return (
                <div key={i}>
                  <SectionLabel>Tip</SectionLabel>
                  <TipSection text={section.text} />
                </div>
              );
            case "suggestions":
              return (
                <div key={i}>
                  <SectionLabel>Try next</SectionLabel>
                  <SuggestionsSection items={section.items} onSuggestionClick={onSuggestionClick} />
                </div>
              );
            case "words":
              return (
                <div key={i}>
                  <SectionLabel>Words to save</SectionLabel>
                  <WordsSection items={section.items} onSaveWord={onSaveWord} fullContent={message.content} />
                </div>
              );
            case "prose":
              return (
                <div key={i} className="space-y-1.5 text-sm cursor-text select-text"
                  style={{ color: "var(--text-secondary)" }}
                  onMouseUp={() => {
                    const selected = window.getSelection()?.toString().trim();
                    if (selected && selected.length >= 2 && selected.split(/\s+/).length <= 4) {
                      onSaveWord(selected, extractSentenceContext(message.content, selected));
                    }
                  }}
                >
                  {renderProse(section.lines)}
                </div>
              );
          }
        })}
      </div>
    </div>
  );
}


// ── Public component ──────────────────────────────────────────────────────────

interface MessageBubbleProps {
  message: AIMessage;
  onSaveWord: (word: string, context: string) => void;
  onSuggestionClick: (text: string) => void;
}

export default function MessageBubble({ message, onSaveWord, onSuggestionClick }: MessageBubbleProps) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[78%] px-4 py-2.5 rounded-xl rounded-tr-none text-sm leading-relaxed"
          style={{
            backgroundColor: "var(--btn-regular-bg-active)",
            color: "var(--text-primary)",
          }}
        >
          {message.content}
        </div>
      </div>
    );
  }

  return <AIBubble message={message} onSaveWord={onSaveWord} onSuggestionClick={onSuggestionClick} />;
}


"use client";

import type { AIMessage } from "@/lib/types";

function extractSentenceContext(fullText: string, selected: string): string {
  const sentences = fullText.split(/(?<=[.!?])\s+/);
  const match = sentences.find((s) =>
    s.toLowerCase().includes(selected.toLowerCase())
  );
  return match?.trim() || selected;
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`)/g);
  return parts.map((part, i) => {
    if ((part.startsWith("**") && part.endsWith("**")) || (part.startsWith("__") && part.endsWith("__"))) {
      return <strong key={i} style={{ color: "var(--text-primary)" }}>{part.slice(2, -2)}</strong>;
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

function renderContent(content: string) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      elements.push(<div key={`sp-${i}`} className="h-1" />);
      i++;
      continue;
    }

    if (/^[-*•]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*•]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*•]\s+/, ""));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="space-y-0.5 pl-3">
          {items.map((item, j) => (
            <li key={j} className="flex gap-2 text-sm">
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

interface MessageBubbleProps {
  message: AIMessage;
  onSaveWord: (word: string, context: string) => void;
}

export default function MessageBubble({ message, onSaveWord }: MessageBubbleProps) {
  const isUser = message.role === "user";

  const handleMouseUp = () => {
    if (isUser) return;
    const selection = window.getSelection();
    const selected = selection?.toString().trim();
    if (!selected || selected.length < 2) return;
    if (selected.split(/\s+/).length > 4) return;
    const context = extractSentenceContext(message.content, selected);
    onSaveWord(selected, context);
  };

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[75%] px-3.5 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed"
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

  return (
    <div className="flex justify-start gap-2.5">
      <div
        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold mt-0.5"
        style={{ backgroundColor: "var(--btn-regular-bg)", color: "var(--primary)" }}
      >
        AI
      </div>

      <div
        className="flex-1 min-w-0 max-w-[85%] px-3.5 py-2.5 rounded-2xl rounded-tl-sm cursor-text select-text space-y-1"
        style={{ backgroundColor: "var(--btn-regular-bg)", color: "var(--text-secondary)" }}
        onMouseUp={handleMouseUp}
        title="Select a word or phrase to save it"
      >
        {renderContent(message.content)}
      </div>
    </div>
  );
}

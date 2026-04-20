"use client";
import Button from "@/components/ui/Button";
import { TAB_LABEL } from "@/lib/admin/seed/types";
import type { ApplyPayload, ChatMessage, Tab } from "@/lib/admin/seed/types";
import { parseApplyBlocks } from "./parseApplyBlocks";

export function ChatMessages({
  messages,
  loading,
  onApply,
  activeTab,
  bottomRef,
}: {
  messages: ChatMessage[];
  loading: boolean;
  onApply: (payload: ApplyPayload) => void;
  activeTab: Tab;
  bottomRef: React.RefObject<HTMLDivElement | null>;
}) {
  function renderMessage(msg: ChatMessage, idx: number) {
    if (msg.role === "user") {
      return (
        <div key={idx} className="flex justify-end">
          <div
            className="max-w-[80%] px-3 py-2 rounded-2xl rounded-tr-sm text-sm"
            style={{ backgroundColor: "var(--primary)", color: "var(--accent-text)" }}
          >
            {msg.content}
          </div>
        </div>
      );
    }

    const applyBlocks = parseApplyBlocks(msg.content);
    const cleanText = msg.content.replace(/```apply[\s\S]*?```/g, "").trim();

    return (
      <div key={idx} className="flex flex-col gap-2">
        {cleanText && (
          <div
            className="max-w-[90%] px-3 py-2 rounded-2xl rounded-tl-sm text-sm whitespace-pre-wrap"
            style={{ backgroundColor: "var(--surface)", color: "var(--text-primary)" }}
          >
            {cleanText}
          </div>
        )}
        {applyBlocks.map((block, bi) => (
          <div
            key={bi}
            className="max-w-[90%] rounded-xl border p-3 flex flex-col gap-2"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--card-bg)" }}
          >
            <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
              Suggestion for{" "}
              <span style={{ color: "var(--primary)" }}>
                {TAB_LABEL[block.tab as Tab] ?? block.tab}
              </span>
            </p>
            <pre className="text-xs overflow-x-auto" style={{ color: "var(--text-primary)" }}>
              {JSON.stringify(block.data, null, 2)}
            </pre>
            <Button
              onClick={() => onApply(block)}
              className="self-start px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              style={{ backgroundColor: "var(--primary)", color: "var(--accent-text)" }}
            >
              Apply to form
            </Button>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.length === 0 && (
        <div className="text-sm text-center mt-8" style={{ color: "var(--text-tertiary)" }}>
          <p className="mb-1">
            Ask me to suggest data for the <strong>{TAB_LABEL[activeTab]}</strong> tab.
          </p>
          <p className="text-xs">e.g. "Suggest 5 minimal pairs for /θ/ vs /ð/"</p>
        </div>
      )}
      {messages.map((m, i) => renderMessage(m, i))}
      {loading && (
        <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-tertiary)" }}>
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Thinking…
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}

"use client";
import { useState, useEffect, useRef } from "react";
import Button from "@/components/ui/Button";
import { TAB_LABEL } from "@/lib/admin/seed/types";
import type { ApplyPayload, ChatMessage, Sound, Tab } from "@/lib/admin/seed/types";
import { ChatMessages } from "./ChatMessages";

export function GeminiChat({
  activeTab,
  sounds,
  onApply,
}: {
  activeTab: Tab;
  sounds: Sound[];
  onApply: (payload: ApplyPayload) => void;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  // Sounds are passed to the server for prompt assembly — server validates and builds the prompt.
  // Raw systemPrompt strings are never sent from the client.
  const soundsForServer = sounds.map((s) => ({
    id: String(s.id),
    ipa: s.ipa,
    type: s.type,
    category: s.category,
    example: s.example,
  }));

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const newMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            messages: newMessages,
            promptKey: "admin-seed",
            activeTab: TAB_LABEL[activeTab],
            sounds: soundsForServer,
          }),
      });
      const json = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "model", content: json.content ?? json.error ?? "No response" },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "model", content: "Error connecting to Gemini." },
      ]);
    }
    setLoading(false);
  }

  return (
    <>
      <Button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105"
        style={{ backgroundColor: "var(--primary)", color: "var(--accent-text)" }}
        title="AI Assistant"
      >
        {open ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )}
      </Button>

      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 w-96 flex flex-col rounded-2xl shadow-2xl border overflow-hidden"
          style={{ height: "520px", backgroundColor: "var(--card-bg)", borderColor: "var(--border)" }}
        >
          <div
            className="flex items-center gap-2 px-4 py-3 border-b"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "var(--primary)" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              AI Seed Assistant
            </span>
            <span
              className="ml-auto text-xs px-2 py-0.5 rounded-full"
              style={{ backgroundColor: "var(--btn-regular-bg)", color: "var(--primary)" }}
            >
              {TAB_LABEL[activeTab]}
            </span>
          </div>

          <ChatMessages
            messages={messages}
            loading={loading}
            onApply={onApply}
            activeTab={activeTab}
            bottomRef={bottomRef}
          />

          <div className="p-3 border-t flex gap-2" style={{ borderColor: "var(--border)" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Ask for suggestions…"
              className="flex-1 px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2"
              style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
            />
            <Button
              onClick={send}
              disabled={loading || !input.trim()}
              className="px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-40"
              style={{ backgroundColor: "var(--primary)", color: "var(--accent-text)" }}
            >
              Send
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

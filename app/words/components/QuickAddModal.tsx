"use client";

import { useEffect, useRef, useState } from "react";
import { X, Sparkles, BookMarked, ChevronDown, Check, CornerDownLeft } from "lucide-react";
import Button from "@/components/ui/Button";
import { useAuth } from "@/components/auth/AuthProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface Deck {
  id: string;
  name: string;
}

interface QuickAddModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: { text: string; context?: string | null; deckId?: string | null }) => Promise<void> | void;
  initialText?: string;
}

type ModalPhase = "idle" | "success";

export function QuickAddModal({ open, onClose, onSubmit, initialText = "" }: QuickAddModalProps) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [context, setContext] = useState("");
  const [phase, setPhase] = useState<ModalPhase>("idle");
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [deckOpen, setDeckOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const deckRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !user) return;
    const supabase = getSupabaseBrowserClient();
    supabase
      .from("decks")
      .select("id, name")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setDecks(data); });
  }, [open, user]);

  useEffect(() => {
    if (!open) return;
    setText(initialText);
    setContext("");
    setPhase("idle");
    setDeckOpen(false);
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(t);
  }, [open, initialText]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (deckOpen) setDeckOpen(false);
        else onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, deckOpen]);

  useEffect(() => {
    if (!deckOpen) return;
    const handler = (e: MouseEvent) => {
      if (deckRef.current && !deckRef.current.contains(e.target as Node)) {
        setDeckOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [deckOpen]);

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    void onSubmit({ text: trimmed, context: context.trim() || null, deckId: selectedDeckId });
    setPhase("success");
    setTimeout(() => { onClose(); setPhase("idle"); }, 1500);
  };

  const selectedDeck = decks.find(d => d.id === selectedDeckId);

  if (!open) return null;

  return (
    <>
      <style>{`
        @keyframes qam-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes qam-success {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
        .qam-input {
          width: 100%;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
          background: var(--bg-tertiary);
          color: var(--fg);
          outline: none;
          box-sizing: border-box;
          box-shadow: inset 0 1px 2px rgba(0,0,0,0.06);
          transition: border-color 150ms, box-shadow 150ms, background 150ms;
          font-family: inherit;
        }
        .qam-input::placeholder { color: var(--text-tertiary); }
        .qam-input:focus {
          border-color: var(--primary);
          background: var(--bg-secondary);
          box-shadow: inset 0 1px 2px rgba(0,0,0,0.04), 0 0 0 3px var(--primary-50);
        }
        .qam-deck-btn:hover { background: var(--bg-tertiary) !important; }
        .qam-deck-item:hover { background: var(--primary-50) !important; color: var(--primary) !important; }
      `}</style>

      {/* Backdrop */}
      <div
        style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)" }}
        className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "0 16px 48px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)",
            animation: "qam-in 200ms ease-out",
            width: "100%",
            maxWidth: 448,
            overflow: "hidden",
          }}
        >
          {phase === "success" ? (
            <div
              style={{ animation: "qam-success 200ms ease-out", padding: "48px 24px" }}
              className="flex flex-col items-center gap-3"
            >
              <div style={{
                width: 48, height: 48, borderRadius: "50%",
                background: "oklch(0.92 0.08 142)",
                color: "oklch(0.38 0.18 142)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Check size={22} strokeWidth={2.5} />
              </div>
              <div className="text-center">
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)" }}>Word saved</p>
                <p style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 2 }}>
                  Meaning, IPA & example on their way…
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div style={{ padding: "18px 20px 16px", borderBottom: "1px solid var(--border)" }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 style={{
                      fontFamily: "var(--font-display), serif",
                      fontWeight: 700,
                      fontSize: "1.0625rem",
                      color: "var(--fg)",
                      margin: "0 0 6px",
                      lineHeight: 1.2,
                    }}>
                      Save a word
                    </h2>
                    {/* AI enrichment hint — redesigned as inline row, not a badge box */}
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <Sparkles size={11} style={{ color: "var(--primary)", flexShrink: 0 }} />
                      <span style={{ fontSize: 11.5, color: "var(--text-tertiary)", letterSpacing: "0.01em" }}>
                        Meaning, IPA &amp; example added automatically
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    aria-label="Close"
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: "var(--text-tertiary)", padding: 4,
                      borderRadius: "var(--radius-sm)", lineHeight: 0, flexShrink: 0,
                    }}
                  >
                    <X size={17} />
                  </button>
                </div>
              </div>

              {/* Body — inputs */}
              <div style={{ padding: "16px 20px" }} className="space-y-3">
                <div className="space-y-1">
                  <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", display: "block", letterSpacing: "0.02em" }}>
                    Word or phrase
                  </label>
                  <input
                    ref={inputRef}
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleSubmit(); }
                    }}
                    placeholder="e.g. serendipity"
                    className="qam-input"
                    style={{ padding: "9px 12px", fontSize: "0.9375rem" }}
                  />
                </div>

                <div className="space-y-1">
                  <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", display: "block", letterSpacing: "0.02em" }}>
                    Context <span style={{ fontWeight: 400, opacity: 0.7 }}>(optional)</span>
                  </label>
                  <textarea
                    value={context}
                    onChange={e => setContext(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); void handleSubmit(); }
                    }}
                    rows={2}
                    placeholder="Sentence where you saw it…"
                    className="qam-input"
                    style={{ padding: "8px 12px", fontSize: "0.875rem", resize: "none" }}
                  />
                </div>
              </div>

              {/* Footer — deck + save on same row */}
              <div
                style={{
                  padding: "12px 20px",
                  borderTop: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  background: "var(--bg)",
                }}
              >
                {/* Deck selector */}
                <div style={{ position: "relative", minWidth: 0 }} ref={deckRef}>
                  <button
                    className="qam-deck-btn"
                    onClick={() => setDeckOpen(v => !v)}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-sm)",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                      padding: "5px 9px", fontSize: 12.5, color: "var(--fg)",
                      cursor: "pointer", maxWidth: 180,
                    }}
                  >
                    <BookMarked size={12} style={{ color: "var(--primary)", flexShrink: 0 }} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                      {selectedDeck ? selectedDeck.name : decks.length > 0 ? "No deck" : "No decks yet"}
                    </span>
                    {decks.length > 0 && (
                      <ChevronDown size={11} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
                    )}
                  </button>

                  {deckOpen && decks.length > 0 && (
                    <div style={{
                      position: "absolute", bottom: "calc(100% + 4px)", left: 0, zIndex: 10,
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-sm)",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                      minWidth: 180, maxHeight: 180, overflowY: "auto",
                    }}>
                      <button
                        className="qam-deck-item"
                        onClick={() => { setSelectedDeckId(null); setDeckOpen(false); }}
                        style={{
                          display: "block", width: "100%", textAlign: "left",
                          padding: "8px 12px", fontSize: 13,
                          color: selectedDeckId === null ? "var(--primary)" : "var(--text-secondary)",
                          background: selectedDeckId === null ? "var(--primary-50)" : "none",
                          border: "none", borderBottom: "1px solid var(--border)", cursor: "pointer",
                        }}
                      >
                        No deck
                      </button>
                      {decks.map(deck => (
                        <button
                          key={deck.id}
                          className="qam-deck-item"
                          onClick={() => { setSelectedDeckId(deck.id); setDeckOpen(false); }}
                          style={{
                            display: "block", width: "100%", textAlign: "left",
                            padding: "8px 12px", fontSize: 13,
                            color: selectedDeckId === deck.id ? "var(--primary)" : "var(--fg)",
                            background: selectedDeckId === deck.id ? "var(--primary-50)" : "none",
                            border: "none", cursor: "pointer",
                          }}
                        >
                          {deck.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Save button with ↵ icon */}
                <Button
                  onClick={() => void handleSubmit()}
                  disabled={!text.trim()}
                  icon={<CornerDownLeft size={13} />}
                  iconPosition="right"
                  size="sm"
                  style={{
                    fontWeight: 600,
                    flexShrink: 0,
                    boxShadow: text.trim()
                      ? "0 2px 8px oklch(0.50 0.15 var(--hue) / 0.30)"
                      : "none",
                  }}
                >
                  Save
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

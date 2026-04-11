"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { getAIWords, saveAIWord, deleteAIWord } from "@/lib/ai-db";
import type { AISavedWord, Difficulty } from "@/lib/types";
import PageHeader from "@/components/layout/PageHeader";

// ── Types ──────────────────────────────────────────────────────────────────

type FilterDifficulty = "all" | Difficulty;
type FilterSource = "all" | "ai" | "manual";
type SortKey = "word" | "savedAt" | "difficulty";
type SortDir = "asc" | "desc";

// ── Constants ──────────────────────────────────────────────────────────────

const DIFFICULTY_STYLES: Record<Difficulty, { badge: string; dot: string; row: string }> = {
  easy:   { badge: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30",  dot: "bg-emerald-500", row: "hover:bg-emerald-500/5" },
  medium: { badge: "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30",        dot: "bg-amber-500",   row: "hover:bg-amber-500/5"   },
  hard:   { badge: "bg-red-500/15 text-red-400 ring-1 ring-red-500/30",              dot: "bg-red-500",     row: "hover:bg-red-500/5"     },
};

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

const CEFR_STYLES: Record<string, string> = {
  A1: "bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30",
  A2: "bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30",
  B1: "bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30",
  B2: "bg-purple-500/15 text-purple-400 ring-1 ring-purple-500/30",
  C1: "bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/30",
  C2: "bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/30",
};

const DIFF_ORDER: Record<Difficulty, number> = { easy: 0, medium: 1, hard: 2 };

// ── Inline editable cell ───────────────────────────────────────────────────

function EditableCell({
  value,
  placeholder,
  onCommit,
  className = "",
}: {
  value: string;
  placeholder: string;
  onCommit: (v: string) => void;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value);
  const inputRef              = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft.trim() !== value) onCommit(draft.trim());
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setDraft(value); setEditing(false); } }}
        className={`w-full bg-[var(--page-bg)] border border-[var(--primary)] rounded-md px-2 py-0.5 text-sm focus:outline-none ${className}`}
        style={{ color: "var(--text-primary)" }}
      />
    );
  }

  return (
    <span
      onClick={() => { setDraft(value); setEditing(true); }}
      title="Click to edit"
      className={`cursor-text rounded-md px-1 py-0.5 hover:bg-[var(--btn-plain-bg-hover)] transition-colors ${value ? "" : "italic"} ${className}`}
      style={{ color: value ? "var(--text-primary)" : "var(--text-tertiary)" }}
    >
      {value || placeholder}
    </span>
  );
}

// ── Tag chip ───────────────────────────────────────────────────────────────

function TagChip({ tag, onRemove }: { tag: string; onRemove?: () => void }) {
  const style = CEFR_STYLES[tag] ?? "bg-[var(--btn-regular-bg)] text-[var(--text-secondary)] ring-1 ring-[var(--line-divider)]";
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${style}`}>
      {tag}
      {onRemove && (
        <button onClick={onRemove} className="opacity-60 hover:opacity-100 leading-none">×</button>
      )}
    </span>
  );
}

// ── Tags cell ──────────────────────────────────────────────────────────────

function TagsCell({ tags = [], onUpdate }: { tags?: string[]; onUpdate: (tags: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (tag: string) => {
    onUpdate(tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag]);
  };

  const addCustom = () => {
    const t = custom.trim().toUpperCase();
    if (t && !tags.includes(t)) onUpdate([...tags, t]);
    setCustom("");
  };

  return (
    <div ref={ref} className="relative flex items-center gap-1 flex-wrap">
      {tags.map((t) => (
        <TagChip key={t} tag={t} onRemove={() => toggle(t)} />
      ))}
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-[10px] px-1.5 py-0.5 rounded-md border border-dashed border-[var(--line-divider)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
        style={{ color: "var(--text-tertiary)" }}
      >
        + tag
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-1 z-30 rounded-xl border border-[var(--line-divider)] p-2.5 shadow-xl w-52 space-y-2"
          style={{ background: "var(--card-bg)" }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>CEFR</p>
          <div className="flex flex-wrap gap-1">
            {CEFR_LEVELS.map((l) => (
              <button
                key={l}
                onClick={() => toggle(l)}
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md transition-opacity ${
                  CEFR_STYLES[l]
                } ${tags.includes(l) ? "opacity-100 ring-2" : "opacity-50 hover:opacity-100"}`}
              >
                {l}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addCustom(); }}
              placeholder="Custom…"
              className="flex-1 px-2 py-1 rounded-lg border border-[var(--line-divider)] bg-[var(--page-bg)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              style={{ color: "var(--text-primary)" }}
            />
            <button
              onClick={addCustom}
              className="px-2 py-1 rounded-lg text-xs font-medium"
              style={{ background: "var(--primary)", color: "var(--accent-text)" }}
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sort icon ──────────────────────────────────────────────────────────────

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <svg className={`w-3 h-3 transition-opacity ${active ? "opacity-100" : "opacity-30"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {dir === "asc" || !active
        ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
      }
    </svg>
  );
}

// ── Add Word Modal ─────────────────────────────────────────────────────────

function AddWordModal({ onSave, onClose }: { onSave: (w: AISavedWord) => void; onClose: () => void }) {
  const [word, setWord]           = useState("");
  const [translation, setTranslation] = useState("");
  const [meaning, setMeaning]     = useState("");
  const [context, setContext]     = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [tags, setTags]           = useState<string[]>([]);
  const [saving, setSaving]       = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim()) return;
    setSaving(true);
    const entry: Omit<AISavedWord, "id"> = {
      word: word.trim(),
      translation: translation.trim() || undefined,
      meaning: meaning.trim(),
      context: context.trim() || word.trim(),
      difficulty,
      tags: tags.length ? tags : undefined,
      conversationId: 0,
      savedAt: new Date().toISOString(),
    };
    const id = await saveAIWord(entry);
    onSave({ ...entry, id });
    setSaving(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-[var(--line-divider)] shadow-2xl p-6 space-y-5"
        style={{ background: "var(--card-bg)" }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold" style={{ color: "var(--deep-text)" }}>Add word</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--btn-plain-bg-hover)] transition-colors" style={{ color: "var(--text-tertiary)" }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                Word <span className="text-red-400">*</span>
              </label>
              <input
                autoFocus
                type="text"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder="e.g. ephemeral"
                required
                className="w-full px-3 py-2 rounded-xl border border-[var(--line-divider)] bg-[var(--page-bg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                style={{ color: "var(--text-primary)" }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Translation</label>
              <input
                type="text"
                value={translation}
                onChange={(e) => setTranslation(e.target.value)}
                placeholder="e.g. efímero"
                className="w-full px-3 py-2 rounded-xl border border-[var(--line-divider)] bg-[var(--page-bg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                style={{ color: "var(--text-primary)" }}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Meaning</label>
            <input
              type="text"
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              placeholder="English definition…"
              className="w-full px-3 py-2 rounded-xl border border-[var(--line-divider)] bg-[var(--page-bg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              style={{ color: "var(--text-primary)" }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Example sentence</label>
            <input
              type="text"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Use it in a sentence…"
              className="w-full px-3 py-2 rounded-xl border border-[var(--line-divider)] bg-[var(--page-bg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              style={{ color: "var(--text-primary)" }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Difficulty</label>
              <div className="flex gap-1.5">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                      difficulty === d ? DIFFICULTY_STYLES[d].badge : "border border-[var(--line-divider)]"
                    }`}
                    style={difficulty !== d ? { color: "var(--text-tertiary)" } : undefined}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>CEFR level</label>
              <div className="flex flex-wrap gap-1">
                {CEFR_LEVELS.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setTags((prev) => prev.includes(l) ? prev.filter((t) => t !== l) : [...prev, l])}
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md transition-opacity ${CEFR_STYLES[l]} ${tags.includes(l) ? "opacity-100" : "opacity-40 hover:opacity-70"}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-[var(--line-divider)] transition-colors"
              style={{ color: "var(--text-secondary)" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!word.trim() || saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
              style={{ background: "var(--primary)", color: "var(--accent-text)" }}
            >
              {saving ? "Saving…" : "Save word"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Table row ──────────────────────────────────────────────────────────────

function WordRow({
  word: w,
  onDelete,
  onUpdate,
}: {
  word: AISavedWord;
  onDelete: (id: number) => void;
  onUpdate: (id: number, patch: Partial<AISavedWord>) => void;
}) {
  const styles = DIFFICULTY_STYLES[w.difficulty];

  const patch = (p: Partial<AISavedWord>) => w.id != null && onUpdate(w.id, p);

  return (
    <tr className={`group border-b border-[var(--line-divider)] transition-colors ${styles.row}`}>
      {/* Word */}
      <td className="py-3 pl-4 pr-2 w-36 align-top">
        <div className="flex items-center gap-2">
          <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${styles.dot}`} />
          <span className="font-semibold text-sm" style={{ color: "var(--deep-text)" }}>{w.word}</span>
        </div>
        <div className="pl-3.5 mt-0.5">
          <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
            {w.conversationId === 0 ? "manual" : "AI"}
          </span>
        </div>
      </td>

      {/* Translation */}
      <td className="py-3 px-2 w-36 align-top">
        <EditableCell
          value={w.translation ?? ""}
          placeholder="add translation"
          onCommit={(v) => patch({ translation: v || undefined })}
          className="text-sm"
        />
      </td>

      {/* Meaning */}
      <td className="py-3 px-2 align-top">
        <EditableCell
          value={w.meaning}
          placeholder="add meaning"
          onCommit={(v) => patch({ meaning: v })}
          className="text-sm leading-relaxed"
        />
      </td>

      {/* Phrase */}
      <td className="py-3 px-2 align-top max-w-xs">
        <EditableCell
          value={w.context !== w.word ? w.context : ""}
          placeholder="add example"
          onCommit={(v) => patch({ context: v || w.word })}
          className="text-sm italic"
        />
      </td>

      {/* Tags */}
      <td className="py-3 px-2 w-40 align-top">
        <TagsCell
          tags={w.tags}
          onUpdate={(tags) => patch({ tags: tags.length ? tags : undefined })}
        />
      </td>

      {/* Difficulty */}
      <td className="py-3 px-2 w-24 align-top">
        <div className="flex gap-1">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              onClick={() => patch({ difficulty: d })}
              title={d}
              className={`w-2 h-2 rounded-full transition-all ${DIFFICULTY_STYLES[d].dot} ${w.difficulty === d ? "scale-125 ring-2 ring-offset-1 ring-offset-transparent ring-current" : "opacity-30 hover:opacity-70"}`}
            />
          ))}
        </div>
      </td>

      {/* Delete */}
      <td className="py-3 pl-2 pr-4 w-10 align-top">
        <button
          onClick={() => w.id != null && onDelete(w.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-red-500/10"
          aria-label="Delete"
        >
          <svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </td>
    </tr>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <tr>
      <td colSpan={7}>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: "var(--btn-regular-bg)" }}>
            <svg className="w-6 h-6" style={{ color: "var(--text-tertiary)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.206 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.794 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.794 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.206 18 16.5 18s-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            {filtered ? "No words match your filters" : "No saved words yet"}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
            {filtered ? "Try adjusting your search or filters" : "Add words manually or save them during AI Practice"}
          </p>
        </div>
      </td>
    </tr>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function SavedWordsPage() {
  const [words, setWords]             = useState<AISavedWord[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showModal, setShowModal]     = useState(false);
  const [search, setSearch]           = useState("");
  const [filterDiff, setFilterDiff]   = useState<FilterDifficulty>("all");
  const [filterSource, setFilterSource] = useState<FilterSource>("all");
  const [sortKey, setSortKey]         = useState<SortKey>("savedAt");
  const [sortDir, setSortDir]         = useState<SortDir>("desc");

  useEffect(() => {
    getAIWords(500).then((data) => { setWords(data); setLoading(false); });
  }, []);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return words
      .filter((w) => {
        if (filterDiff !== "all" && w.difficulty !== filterDiff) return false;
        if (filterSource === "ai" && w.conversationId === 0) return false;
        if (filterSource === "manual" && w.conversationId !== 0) return false;
        if (q) {
          const hay = [w.word, w.translation ?? "", w.meaning, w.context, ...(w.tags ?? [])].join(" ").toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortKey === "word")       cmp = a.word.localeCompare(b.word);
        if (sortKey === "savedAt")    cmp = a.savedAt.localeCompare(b.savedAt);
        if (sortKey === "difficulty") cmp = DIFF_ORDER[a.difficulty] - DIFF_ORDER[b.difficulty];
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [words, search, filterDiff, filterSource, sortKey, sortDir]);

  const counts = useMemo(() => ({
    total: words.length,
    ai: words.filter((w) => w.conversationId !== 0).length,
    manual: words.filter((w) => w.conversationId === 0).length,
    easy: words.filter((w) => w.difficulty === "easy").length,
    medium: words.filter((w) => w.difficulty === "medium").length,
    hard: words.filter((w) => w.difficulty === "hard").length,
  }), [words]);

  const handleSave = (w: AISavedWord) => setWords((prev) => [w, ...prev]);

  const handleDelete = async (id: number) => {
    await deleteAIWord(id);
    setWords((prev) => prev.filter((w) => w.id !== id));
  };

  const handleUpdate = async (id: number, patch: Partial<AISavedWord>) => {
    // Optimistic update
    setWords((prev) => prev.map((w) => (w.id === id ? { ...w, ...patch } : w)));
    // Persist via Dexie
    const { db } = await import("@/lib/db");
    await db.aiWords.update(id, patch);
  };

  const thClass = "px-2 py-3 text-left text-[11px] font-semibold uppercase tracking-wider select-none";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Saved Words"
        subtitle="Words collected from AI practice and manual entries"
      />

      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {[
          { label: "Total",  value: counts.total,  color: "var(--primary)" },
          { label: "From AI", value: counts.ai,    color: "var(--text-secondary)" },
          { label: "Manual", value: counts.manual, color: "var(--text-secondary)" },
          { label: "Easy",   value: counts.easy,   color: "#10b981" },
          { label: "Medium", value: counts.medium, color: "#f59e0b" },
          { label: "Hard",   value: counts.hard,   color: "#ef4444" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-[var(--line-divider)] bg-[var(--card-bg)] p-4 text-center">
            <p className="text-xl font-bold tabular-nums" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Search */}
        <div className="relative flex-1 w-full sm:max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--text-tertiary)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search words, tags…"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-[var(--line-divider)] bg-[var(--card-bg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            style={{ color: "var(--text-primary)" }}
          />
        </div>

        {/* Source filter */}
        <div className="flex rounded-xl border border-[var(--line-divider)] overflow-hidden text-xs font-medium">
          {(["all", "ai", "manual"] as FilterSource[]).map((s) => (
            <button
              key={s}
              onClick={() => setFilterSource(s)}
              className="px-3 py-2 capitalize transition-colors"
              style={filterSource === s ? { background: "var(--primary)", color: "var(--accent-text)" } : { color: "var(--text-secondary)" }}
            >
              {s === "all" ? "All" : s === "ai" ? "AI" : "Manual"}
            </button>
          ))}
        </div>

        {/* Difficulty filter */}
        <div className="flex rounded-xl border border-[var(--line-divider)] overflow-hidden text-xs font-medium">
          {(["all", "easy", "medium", "hard"] as FilterDifficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => setFilterDiff(d)}
              className="px-3 py-2 capitalize transition-colors"
              style={filterDiff === d ? { background: "var(--primary)", color: "var(--accent-text)" } : { color: "var(--text-secondary)" }}
            >
              {d === "all" ? "All" : d}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium ml-auto sm:ml-0 flex-shrink-0 transition-colors"
          style={{ background: "var(--primary)", color: "var(--accent-text)" }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add word
        </button>
      </div>

      {/* Modal */}
      {showModal && <AddWordModal onSave={handleSave} onClose={() => setShowModal(false)} />}

      {/* Result count */}
      {!loading && words.length > 0 && (
        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          {filtered.length} {filtered.length === 1 ? "word" : "words"}
          {filtered.length !== words.length && ` of ${words.length}`}
        </p>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-[var(--line-divider)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-[var(--line-divider)]" style={{ background: "var(--card-bg)" }}>
                <th
                  className={`${thClass} pl-4 cursor-pointer`}
                  style={{ color: "var(--text-tertiary)" }}
                  onClick={() => handleSort("word")}
                >
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Word
                    <SortIcon active={sortKey === "word"} dir={sortDir} />
                  </span>
                </th>
                <th className={thClass} style={{ color: "var(--text-tertiary)" }}>
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
                    Translation
                  </span>
                </th>
                <th className={thClass} style={{ color: "var(--text-tertiary)" }}>
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h7" /></svg>
                    Meaning
                  </span>
                </th>
                <th className={thClass} style={{ color: "var(--text-tertiary)" }}>
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                    Phrase
                  </span>
                </th>
                <th className={thClass} style={{ color: "var(--text-tertiary)" }}>
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                    Tags
                  </span>
                </th>
                <th
                  className={`${thClass} cursor-pointer`}
                  style={{ color: "var(--text-tertiary)" }}
                  onClick={() => handleSort("difficulty")}
                >
                  <span className="flex items-center gap-1">
                    Level
                    <SortIcon active={sortKey === "difficulty"} dir={sortDir} />
                  </span>
                </th>
                <th className="w-10" />
              </tr>
            </thead>

            <tbody style={{ background: "var(--page-bg)" }}>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[var(--line-divider)]">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-2 py-4">
                        <div className="h-4 rounded-md bg-[var(--btn-regular-bg)] animate-pulse" style={{ width: `${60 + (i + j) * 13 % 40}%` }} />
                      </td>
                    ))}
                    <td />
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <EmptyState filtered={words.length > 0} />
              ) : (
                filtered.map((w) => (
                  <WordRow key={w.id} word={w} onDelete={handleDelete} onUpdate={handleUpdate} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

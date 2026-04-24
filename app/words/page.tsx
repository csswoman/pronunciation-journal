"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Sparkles, Search, X } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import PageHeader from "@/components/layout/PageHeader";
import Section from "@/components/layout/Section";
import Card from "@/components/layout/Card";
import Button from "@/components/ui/Button";
import { useWords } from "@/hooks/useWords";
import { QuickAddModal } from "./components/QuickAddModal";
import { WordCard } from "./components/WordCard";

const ITEMS_PER_PAGE = 12;

type FilterType = "all" | "difficult" | "ready" | "processing";

export default function WordsPage() {
  const { words, loading, error, addWord, removeWord, markDifficult, retry } = useWords();
  const [showAdd, setShowAdd] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [initialWordText, setInitialWordText] = useState("");

  useEffect(() => {
    if (!actionError) return;
    const t = setTimeout(() => setActionError(null), 4000);
    return () => clearTimeout(t);
  }, [actionError]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (showAdd) return;
      const target = e.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      if (isTyping) return;
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        setShowAdd(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showAdd]);

  const stats = useMemo(() => {
    const ready = words.filter(w => w.status === "ready").length;
    const processing = words.filter(w => w.status === "processing").length;
    const difficult = words.filter(w => w.difficulty > 0).length;
    return { total: words.length, ready, processing, difficult };
  }, [words]);

  const filteredWords = useMemo(() => {
    let result = words;

    if (filterType === "difficult") {
      result = result.filter(w => w.difficulty > 0);
    } else if (filterType === "ready") {
      result = result.filter(w => w.status === "ready");
    } else if (filterType === "processing") {
      result = result.filter(w => w.status === "processing");
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(w =>
        w.text.toLowerCase().includes(query) ||
        w.translation?.toLowerCase().includes(query) ||
        w.meaning?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [words, filterType, searchQuery]);

  const totalPages = Math.ceil(filteredWords.length / ITEMS_PER_PAGE);
  const paginatedWords = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredWords.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredWords, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, searchQuery]);

  const handleAdd = async (input: { text: string; context?: string | null }) => {
    try {
      await addWord(input);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to save word");
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await removeWord(id);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to delete word");
    }
  };

  const handleDifficult = async (id: string) => {
    try {
      await markDifficult(id);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to update word");
    }
  };

  const handleRetry = async (id: string) => {
    try {
      await retry(id);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to retry");
    }
  };

  return (
    <>
      <PageLayout
        hero={
          <PageHeader
            badge="Word Bank"
            title="Your Words"
            subtitle="Capture & enrich"
            description="Save any word you encounter — meaning, translation, IPA and an example are added automatically."
            primaryCta={{
              label: "New Word",
              icon: <Plus size={16} />,
              onClick: () => setShowAdd(true),
            }}
            illustration={<HeroGlyph />}
          />
        }
      >
        <Section spacing="lg">
          {/* Stat strip - Filterable */}
          {!loading && words.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterType("all")}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  filterType === "all"
                    ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                    : "border-[var(--line-divider)] bg-[var(--card-bg)] text-[var(--text-secondary)] hover:border-[var(--primary)]"
                }`}
              >
                <span className="font-semibold tabular-nums">{stats.total}</span>
                <span className="opacity-80">All</span>
              </button>

              <button
                onClick={() => setFilterType("ready")}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  filterType === "ready"
                    ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                    : "border-[var(--line-divider)] bg-[var(--card-bg)] text-[var(--text-secondary)] hover:border-[var(--primary)]"
                }`}
              >
                <span className="font-semibold tabular-nums">{stats.ready}</span>
                <span className="opacity-80">Ready</span>
              </button>

              {stats.processing > 0 && (
                <button
                  onClick={() => setFilterType("processing")}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    filterType === "processing"
                      ? "bg-[color-mix(in_oklch,var(--primary)_100%,transparent)] text-white border-[var(--primary)]"
                      : "border-[color-mix(in_oklch,var(--primary)_35%,transparent)] bg-[color-mix(in_oklch,var(--primary)_10%,transparent)] text-[var(--primary)] hover:border-[var(--primary)]"
                  }`}
                >
                  <span className="font-semibold tabular-nums">{stats.processing}</span>
                  <span className="opacity-80">Enriching</span>
                </button>
              )}

              {stats.difficult > 0 && (
                <button
                  onClick={() => setFilterType("difficult")}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    filterType === "difficult"
                      ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                      : "border-[var(--line-divider)] bg-[var(--card-bg)] text-[var(--text-secondary)] hover:border-[var(--primary)]"
                  }`}
                >
                  <span className="font-semibold tabular-nums">{stats.difficult}</span>
                  <span className="opacity-80">Difficult</span>
                </button>
              )}
            </div>
          )}

          {/* Search bar */}
          {!loading && words.length > 0 && (
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
              />
              <input
                type="text"
                placeholder="Search by word, translation, or meaning..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const query = searchQuery.trim();
                    if (query) {
                      const wordExists = words.some(w =>
                        w.text.toLowerCase() === query.toLowerCase()
                      );
                      if (!wordExists) {
                        setInitialWordText(query);
                        setSearchQuery("");
                        setShowAdd(true);
                      }
                    }
                  }
                }}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[var(--line-divider)] bg-[var(--card-bg)] text-sm text-[var(--deep-text)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[color-mix(in_oklch,var(--primary)_20%,transparent)]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--deep-text)] transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          )}

          {/* Inline error toast */}
          {(error || actionError) && (
            <Card className="!p-3 border-[var(--error)]/40 bg-[color-mix(in_oklch,var(--error)_8%,var(--card-bg))]">
              <p className="text-sm text-[var(--error)]">
                {error ?? actionError}
              </p>
            </Card>
          )}

          {/* Body */}
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <Card
                  key={i}
                  className="h-20 rounded-2xl animate-pulse"
                  style={{ backgroundColor: "var(--btn-regular-bg)" }}
                >
                  <div />
                </Card>
              ))}
            </div>
          ) : words.length === 0 ? (
            <EmptyState onAdd={() => setShowAdd(true)} />
          ) : filteredWords.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-sm text-[var(--text-secondary)]">
                No words found matching your search or filter.
              </p>
            </Card>
          ) : (
            <>
              <div className="space-y-2">
                {paginatedWords.map(word => (
                  <WordCard
                    key={word.id}
                    word={word}
                    onMarkDifficult={handleDifficult}
                    onRetry={handleRetry}
                    onDelete={handleRemove}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-[var(--text-secondary)]">
                    Page <span className="font-semibold">{currentPage}</span> of{" "}
                    <span className="font-semibold">{totalPages}</span> ({filteredWords.length} total)
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--btn-regular-bg)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--btn-regular-bg)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </Section>
      </PageLayout>

      {/* Floating quick-add (mobile-friendly) */}
      <Button
        onClick={() => setShowAdd(true)}
        aria-label="Quick add word"
        className="fixed bottom-6 right-6 z-40 lg:hidden !rounded-full !p-4 shadow-xl"
        size="icon"
      >
        <Plus size={20} />
      </Button>

      <QuickAddModal
        open={showAdd}
        onClose={() => {
          setShowAdd(false);
          setInitialWordText("");
        }}
        onSubmit={handleAdd}
        initialText={initialWordText}
      />
    </>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function Stat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border"
      style={
        highlight
          ? {
              borderColor: "color-mix(in oklch, var(--primary) 35%, transparent)",
              background: "color-mix(in oklch, var(--primary) 10%, transparent)",
              color: "var(--primary)",
            }
          : {
              borderColor: "var(--line-divider)",
              background: "var(--card-bg)",
              color: "var(--text-secondary)",
            }
      }
    >
      <span className="font-semibold tabular-nums">{value}</span>
      <span className="opacity-80">{label}</span>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <Card className="p-12 text-center">
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{
            background: "color-mix(in oklch, var(--primary) 10%, var(--btn-regular-bg))",
            color: "var(--primary)",
          }}
        >
          <Sparkles size={28} />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--deep-text)" }}>
            Your word bank is empty
          </p>
          <p
            className="text-xs mt-1 max-w-sm"
            style={{ color: "var(--text-tertiary)" }}
          >
            Add a word while you read or watch — Gemini will add meaning,
            translation, IPA and an example automatically.
          </p>
        </div>
        <Button onClick={onAdd} icon={<Plus size={16} />}>
          Add your first word
        </Button>
        <p className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
          Tip: press <kbd className="px-1.5 py-0.5 rounded bg-[var(--btn-regular-bg)] font-mono">N</kbd> anywhere
        </p>
      </div>
    </Card>
  );
}

function HeroGlyph() {
  // Lightweight inline SVG so the page doesn't depend on a new asset file.
  return (
    <svg
      viewBox="0 0 280 200"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Word bank illustration"
    >
      <defs>
        <linearGradient id="wb-grad" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.85" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.45" />
        </linearGradient>
      </defs>
      <rect
        x="40"
        y="40"
        width="200"
        height="120"
        rx="18"
        fill="var(--card-bg)"
        stroke="var(--line-divider)"
        strokeWidth="1.5"
      />
      <rect x="60" y="62" width="120" height="10" rx="5" fill="url(#wb-grad)" />
      <rect x="60" y="84" width="160" height="6" rx="3" fill="var(--line-divider)" />
      <rect x="60" y="98" width="100" height="6" rx="3" fill="var(--line-divider)" />
      <rect x="60" y="112" width="140" height="6" rx="3" fill="var(--line-divider)" />
      <rect x="60" y="130" width="60" height="14" rx="7" fill="url(#wb-grad)" />
      <circle cx="232" cy="50" r="14" fill="var(--primary)" opacity="0.9" />
      <path
        d="M226 50 l4 4 l8 -8"
        stroke="var(--card-bg)"
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

"use client";
import Button from "@/components/ui/Button";
import type { Tab } from "@/lib/admin/seed/types";
import { GeminiChat } from "@/app/admin/seed/GeminiChat/GeminiChat";
import { SoundsTab } from "@/app/admin/seed/SoundsTab";
import { WordsTab } from "@/app/admin/seed/WordsTab";
import { PatternsTab } from "@/app/admin/seed/PatternsTab";
import { MinimalPairsTab } from "@/app/admin/seed/MinimalPairsTab";
import { useSeedPage } from "@/app/admin/seed/useSeedPage";

const TABS: { id: Tab; label: string }[] = [
  { id: "sounds",        label: "Sounds" },
  { id: "words",         label: "Words" },
  { id: "patterns",      label: "Patterns" },
  { id: "minimal_pairs", label: "Minimal Pairs" },
];

export default function SeedPage() {
  const {
    tab, setTab, allSounds,
    soundForm, setSoundForm,
    wordForm, setWordForm,
    patternForm, setPatternForm,
    patternWordForm, setPatternWordForm,
    mpForm, setMpForm,
    handleApply,
  } = useSeedPage();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--page-bg)" }}>
      <header style={{ backgroundColor: "var(--page-bg)" }}>
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--btn-regular-bg)", color: "var(--primary)" }}>
              Admin
            </span>
            <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>Seed Data</h1>
          </div>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Manage system content — sounds, words, patterns, and minimal pairs used in exercises.
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pb-16">
        <div className="flex gap-1 mb-8 border-b" style={{ borderColor: "var(--border)" }}>
          {TABS.map((t) => (
            <Button key={t.id} onClick={() => setTab(t.id)}
              className="px-4 py-2.5 text-sm font-medium transition-colors relative"
              style={{
                color: tab === t.id ? "var(--primary)" : "var(--text-secondary)",
                borderBottom: tab === t.id ? "2px solid var(--primary)" : "2px solid transparent",
              }}>
              {t.label}
            </Button>
          ))}
        </div>

        {tab === "sounds"        && <SoundsTab form={soundForm} setForm={setSoundForm} />}
        {tab === "words"         && <WordsTab form={wordForm} setForm={setWordForm} />}
        {tab === "patterns"      && <PatternsTab patternForm={patternForm} setPatternForm={setPatternForm} patternWordForm={patternWordForm} setPatternWordForm={setPatternWordForm} />}
        {tab === "minimal_pairs" && <MinimalPairsTab form={mpForm} setForm={setMpForm} />}
      </main>

      <GeminiChat activeTab={tab} sounds={allSounds} onApply={handleApply} />
    </div>
  );
}


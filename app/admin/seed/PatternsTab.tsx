"use client";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import StatusBadge from "@/components/ui/StatusBadge";
import Table from "@/components/ui/Table";
import { usePatternsTab } from "@/app/admin/seed/usePatternsTab";
import type { PatternForm, PatternWordForm } from "@/lib/admin/seed/types";

export function PatternsTab({
  patternForm,
  setPatternForm,
  patternWordForm,
  setPatternWordForm,
}: {
  patternForm: PatternForm;
  setPatternForm: (f: PatternForm) => void;
  patternWordForm: PatternWordForm;
  setPatternWordForm: (f: PatternWordForm) => void;
}) {
  const {
    patterns,
    patternWords,
    pStatus,
    pSaving,
    pwStatus,
    pwSaving,
    patternOptions,
    handlePatternSubmit,
    handlePatternWordSubmit,
  } = usePatternsTab({
    patternForm,
    setPatternForm,
    patternWordForm,
    setPatternWordForm,
  });

  return (
    <div className="space-y-6">
      <form
        onSubmit={handlePatternSubmit}
        className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 rounded-xl border"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--card-bg)" }}
      >
        <h3 className="col-span-full text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Add Pattern
        </h3>
        <Input
          label="Pattern string"
          value={patternForm.pattern}
          onChange={(v) => setPatternForm({ ...patternForm, pattern: v })}
          placeholder="ough"
          required
        />
        <Select
          label="Type"
          value={patternForm.type}
          onChange={(v) => setPatternForm({ ...patternForm, type: v })}
          options={[
            { value: "vowel", label: "Vowel" },
            { value: "consonant", label: "Consonant" },
            { value: "digraph", label: "Digraph" },
            { value: "silent", label: "Silent letter" },
            { value: "blend", label: "Consonant blend" },
            { value: "diphthong", label: "Diphthong" },
          ]}
        />
        <Input
          label="Sound focus (IPA)"
          value={patternForm.focus}
          onChange={(v) => setPatternForm({ ...patternForm, focus: v })}
          placeholder="oʊ"
        />
        <div className="col-span-full flex items-center gap-4">
          <Button
            type="submit"
            disabled={pSaving || !patternForm.pattern.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: "var(--primary)", color: "var(--accent-text)" }}
          >
            {pSaving ? "Saving…" : "Add pattern"}
          </Button>
          {pStatus && <StatusBadge ok={pStatus.ok} message={pStatus.msg} />}
        </div>
      </form>

      <form
        onSubmit={handlePatternWordSubmit}
        className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 rounded-xl border"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--card-bg)" }}
      >
        <h3 className="col-span-full text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Add Word to Pattern
        </h3>
        <Select
          label="Pattern"
          value={patternWordForm.patternId}
          onChange={(v) => setPatternWordForm({ ...patternWordForm, patternId: v })}
          options={patternOptions}
          required
        />
        <Input
          label="Word"
          value={patternWordForm.word}
          onChange={(v) => setPatternWordForm({ ...patternWordForm, word: v })}
          placeholder="though"
          required
        />
        <Input
          label="IPA"
          value={patternWordForm.ipa}
          onChange={(v) => setPatternWordForm({ ...patternWordForm, ipa: v })}
          placeholder="/ðoʊ/"
        />
        <div className="col-span-full flex items-center gap-4">
          <Button
            type="submit"
            disabled={pwSaving || !patternWordForm.patternId || !patternWordForm.word.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: "var(--primary)", color: "var(--accent-text)" }}
          >
            {pwSaving ? "Saving…" : "Add word"}
          </Button>
          {pwStatus && <StatusBadge ok={pwStatus.ok} message={pwStatus.msg} />}
        </div>
      </form>

      <div className="space-y-4">
        <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
          {patterns.length} patterns — {patternWords.length} pattern words
        </p>
        <Table
          headers={["ID", "Pattern", "Type", "Sound focus", "Words"]}
          rows={patterns.map((p) => [
            p.id,
            `"${p.pattern}"`,
            p.type,
            p.sound_focus ? `/${p.sound_focus}/` : null,
            patternWords.filter((pw) => pw.pattern_id === p.id).length,
          ])}
        />
      </div>
    </div>
  );
}

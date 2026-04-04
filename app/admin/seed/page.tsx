"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Sound {
  id: number;
  ipa: string;
  type: "vowel" | "consonant" | "diphthong";
  category: string | null;
  example: string | null;
  difficulty: number | null;
}

interface Word {
  id: number;
  word: string;
  ipa: string | null;
  sound_id: number | null;
  difficulty: number | null;
  audio_url: string | null;
  sound_focus: string | null;
}

interface Pattern {
  id: number;
  pattern: string;
  type: string | null;
  sound_focus: string | null;
}

interface PatternWord {
  id: number;
  pattern_id: number;
  word: string;
  ipa: string | null;
}

interface MinimalPair {
  id: number;
  word_a: string | null;
  word_b: string | null;
  ipa_a: string | null;
  ipa_b: string | null;
  sound_group: string | null;
  sound_a_id: number | null;
  sound_b_id: number | null;
  contrast_sound_a_id: number | null;
  contrast_sound_b_id: number | null;
  contrast_ipa_a: string | null;
  contrast_ipa_b: string | null;
}

type Tab = "sounds" | "words" | "patterns" | "minimal_pairs";

// ── Form state types ──────────────────────────────────────────────────────────

interface SoundForm { ipa: string; type: string; category: string; example: string; difficulty: string }
interface WordForm { word: string; ipa: string; soundId: string; soundFocus: string; difficulty: string }
interface PatternForm { pattern: string; type: string; focus: string }
interface PatternWordForm { patternId: string; word: string; ipa: string }
interface MinimalPairForm {
  wordA: string; wordB: string; ipaA: string; ipaB: string; soundGroup: string;
  soundAId: string; soundBId: string; contrastAId: string; contrastBId: string;
  contrastIpaA: string; contrastIpaB: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function supabase() { return getSupabaseBrowserClient(); }

function Input({ label, value, onChange, placeholder, type = "text", required }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
      />
    </div>
  );
}

function Select({ label, value, onChange, options, required }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <select
        value={value} onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function StatusBadge({ ok, message }: { ok: boolean | null; message: string }) {
  if (ok === null) return null;
  return (
    <div className="px-3 py-2 rounded-lg text-sm" style={{
      backgroundColor: ok ? "var(--success-bg, #dcfce7)" : "var(--error-bg, #fee2e2)",
      color: ok ? "#166534" : "#991b1b",
    }}>
      {message}
    </div>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: (string | number | null)[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "var(--border)" }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ backgroundColor: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
            {headers.map((h) => (
              <th key={h} className="px-3 py-2 text-left text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t" style={{ borderColor: "var(--border)", backgroundColor: i % 2 === 0 ? "transparent" : "var(--surface)" }}>
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2" style={{ color: "var(--text-primary)" }}>
                  {cell ?? <span style={{ color: "var(--text-tertiary)" }}>—</span>}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={headers.length} className="px-3 py-4 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>
                No records yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ── Tab: Sounds ───────────────────────────────────────────────────────────────

function SoundsTab({ form, setForm }: { form: SoundForm; setForm: (f: SoundForm) => void }) {
  const [sounds, setSounds] = useState<Sound[]>([]);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase().from("sounds").select("*").order("id");
    setSounds((data as Sound[]) ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.ipa.trim()) return;
    setSaving(true); setStatus(null);
    const { error } = await supabase().from("sounds").insert({
      ipa: form.ipa.trim(), type: form.type as Sound["type"],
      category: form.category.trim() || null, example: form.example.trim() || null,
      difficulty: form.difficulty ? Number(form.difficulty) : null,
    });
    setSaving(false);
    if (error) { setStatus({ ok: false, msg: error.message }); }
    else {
      setStatus({ ok: true, msg: `Sound /${form.ipa.trim()}/ added.` });
      setForm({ ipa: "", type: "vowel", category: "", example: "", difficulty: "1" });
      load();
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 rounded-xl border" style={{ borderColor: "var(--border)", backgroundColor: "var(--card-bg)" }}>
        <h3 className="col-span-full text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Add Sound</h3>
        <Input label="IPA symbol" value={form.ipa} onChange={(v) => setForm({ ...form, ipa: v })} placeholder="æ" required />
        <Select label="Type" value={form.type} onChange={(v) => setForm({ ...form, type: v })} options={[
          { value: "vowel", label: "Vowel" }, { value: "consonant", label: "Consonant" }, { value: "diphthong", label: "Diphthong" },
        ]} required />
        <Input label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v })} placeholder="short vowel" />
        <Input label="Example word" value={form.example} onChange={(v) => setForm({ ...form, example: v })} placeholder="cat" />
        <Select label="Difficulty (1–3)" value={form.difficulty} onChange={(v) => setForm({ ...form, difficulty: v })} options={[
          { value: "1", label: "1 — Easy" }, { value: "2", label: "2 — Medium" }, { value: "3", label: "3 — Hard" },
        ]} />
        <div className="col-span-full flex items-center gap-4">
          <button type="submit" disabled={saving || !form.ipa.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: "var(--primary)", color: "var(--accent-text)" }}>
            {saving ? "Saving…" : "Add sound"}
          </button>
          {status && <StatusBadge ok={status.ok} message={status.msg} />}
        </div>
      </form>
      <div>
        <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>{sounds.length} sounds in DB</p>
        <Table headers={["ID", "IPA", "Type", "Category", "Example", "Difficulty"]}
          rows={sounds.map((s) => [s.id, `/${s.ipa}/`, s.type, s.category, s.example, s.difficulty])} />
      </div>
    </div>
  );
}

// ── Tab: Words ────────────────────────────────────────────────────────────────

function WordsTab({ form, setForm }: { form: WordForm; setForm: (f: WordForm) => void }) {
  const [sounds, setSounds] = useState<Sound[]>([]);
  const [words, setWords] = useState<Word[]>([]);
  const [filterSound, setFilterSound] = useState("");
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [{ data: s }, { data: w }] = await Promise.all([
      supabase().from("sounds").select("*").order("id"),
      supabase().from("words").select("*").order("id"),
    ]);
    setSounds((s as Sound[]) ?? []);
    setWords((w as Word[]) ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.word.trim()) return;
    setSaving(true); setStatus(null);
    const { error } = await supabase().from("words").insert({
      word: form.word.trim(), ipa: form.ipa.trim() || null,
      sound_id: form.soundId ? Number(form.soundId) : null,
      sound_focus: form.soundFocus.trim() || null,
      difficulty: form.difficulty ? Number(form.difficulty) : null, audio_url: null,
    });
    setSaving(false);
    if (error) { setStatus({ ok: false, msg: error.message }); }
    else {
      setStatus({ ok: true, msg: `"${form.word.trim()}" added.` });
      setForm({ word: "", ipa: "", soundId: "", soundFocus: "", difficulty: "1" });
      load();
    }
  }

  const displayed = filterSound ? words.filter((w) => String(w.sound_id) === filterSound) : words;
  const soundOptions = [
    { value: "", label: "— none —" },
    ...sounds.map((s) => ({ value: String(s.id), label: `/${s.ipa}/ (${s.category ?? s.type})` })),
  ];

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 rounded-xl border" style={{ borderColor: "var(--border)", backgroundColor: "var(--card-bg)" }}>
        <h3 className="col-span-full text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Add Word</h3>
        <Input label="Word" value={form.word} onChange={(v) => setForm({ ...form, word: v })} placeholder="cat" required />
        <Input label="IPA" value={form.ipa} onChange={(v) => setForm({ ...form, ipa: v })} placeholder="/kæt/" />
        <Select label="Linked sound" value={form.soundId} onChange={(v) => setForm({ ...form, soundId: v })} options={soundOptions} />
        <Input label="Sound focus (IPA)" value={form.soundFocus} onChange={(v) => setForm({ ...form, soundFocus: v })} placeholder="æ" />
        <Select label="Difficulty (1–3)" value={form.difficulty} onChange={(v) => setForm({ ...form, difficulty: v })} options={[
          { value: "1", label: "1 — Easy" }, { value: "2", label: "2 — Medium" }, { value: "3", label: "3 — Hard" },
        ]} />
        <div className="col-span-full flex items-center gap-4">
          <button type="submit" disabled={saving || !form.word.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: "var(--primary)", color: "var(--accent-text)" }}>
            {saving ? "Saving…" : "Add word"}
          </button>
          {status && <StatusBadge ok={status.ok} message={status.msg} />}
        </div>
      </form>
      <div>
        <div className="flex items-center gap-4 mb-2">
          <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>{displayed.length} / {words.length} words</p>
          <select value={filterSound} onChange={(e) => setFilterSound(e.target.value)}
            className="px-2 py-1 rounded text-xs border"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}>
            {soundOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.value ? `Filter: /${sounds.find((s) => String(s.id) === o.value)?.ipa}/` : "All sounds"}
              </option>
            ))}
          </select>
        </div>
        <Table headers={["ID", "Word", "IPA", "Sound ID", "Sound focus", "Difficulty"]}
          rows={displayed.map((w) => [w.id, w.word, w.ipa, w.sound_id, w.sound_focus, w.difficulty])} />
      </div>
    </div>
  );
}

// ── Tab: Patterns ─────────────────────────────────────────────────────────────

function PatternsTab({
  patternForm, setPatternForm, patternWordForm, setPatternWordForm,
}: {
  patternForm: PatternForm; setPatternForm: (f: PatternForm) => void;
  patternWordForm: PatternWordForm; setPatternWordForm: (f: PatternWordForm) => void;
}) {
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [patternWords, setPatternWords] = useState<PatternWord[]>([]);
  const [pStatus, setPStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [pSaving, setPSaving] = useState(false);
  const [pwStatus, setPwStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [pwSaving, setPwSaving] = useState(false);

  const load = useCallback(async () => {
    const [{ data: p }, { data: pw }] = await Promise.all([
      supabase().from("patterns").select("*").order("id"),
      supabase().from("pattern_words").select("*").order("id"),
    ]);
    setPatterns((p as Pattern[]) ?? []);
    setPatternWords((pw as PatternWord[]) ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handlePatternSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!patternForm.pattern.trim()) return;
    setPSaving(true); setPStatus(null);
    const { error } = await supabase().from("patterns").insert({
      pattern: patternForm.pattern.trim(), type: patternForm.type || null,
      sound_focus: patternForm.focus.trim() || null,
    });
    setPSaving(false);
    if (error) { setPStatus({ ok: false, msg: error.message }); }
    else {
      setPStatus({ ok: true, msg: `Pattern "${patternForm.pattern.trim()}" added.` });
      setPatternForm({ pattern: "", type: "vowel", focus: "" });
      load();
    }
  }

  async function handlePatternWordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!patternWordForm.patternId || !patternWordForm.word.trim()) return;
    setPwSaving(true); setPwStatus(null);
    const { error } = await supabase().from("pattern_words").insert({
      pattern_id: Number(patternWordForm.patternId),
      word: patternWordForm.word.trim(), ipa: patternWordForm.ipa.trim() || null,
    });
    setPwSaving(false);
    if (error) { setPwStatus({ ok: false, msg: error.message }); }
    else {
      setPwStatus({ ok: true, msg: `"${patternWordForm.word.trim()}" added.` });
      setPatternWordForm({ ...patternWordForm, word: "", ipa: "" });
      load();
    }
  }

  const patternOptions = [
    { value: "", label: "— select pattern —" },
    ...patterns.map((p) => ({ value: String(p.id), label: `"${p.pattern}" (${p.type ?? "?"})` })),
  ];

  return (
    <div className="space-y-6">
      <form onSubmit={handlePatternSubmit} className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 rounded-xl border" style={{ borderColor: "var(--border)", backgroundColor: "var(--card-bg)" }}>
        <h3 className="col-span-full text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Add Pattern</h3>
        <Input label="Pattern string" value={patternForm.pattern} onChange={(v) => setPatternForm({ ...patternForm, pattern: v })} placeholder="ough" required />
        <Select label="Type" value={patternForm.type} onChange={(v) => setPatternForm({ ...patternForm, type: v })} options={[
          { value: "vowel", label: "Vowel" }, { value: "consonant", label: "Consonant" },
          { value: "digraph", label: "Digraph" }, { value: "silent", label: "Silent letter" },
          { value: "blend", label: "Consonant blend" }, { value: "diphthong", label: "Diphthong" },
        ]} />
        <Input label="Sound focus (IPA)" value={patternForm.focus} onChange={(v) => setPatternForm({ ...patternForm, focus: v })} placeholder="oʊ" />
        <div className="col-span-full flex items-center gap-4">
          <button type="submit" disabled={pSaving || !patternForm.pattern.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: "var(--primary)", color: "var(--accent-text)" }}>
            {pSaving ? "Saving…" : "Add pattern"}
          </button>
          {pStatus && <StatusBadge ok={pStatus.ok} message={pStatus.msg} />}
        </div>
      </form>

      <form onSubmit={handlePatternWordSubmit} className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 rounded-xl border" style={{ borderColor: "var(--border)", backgroundColor: "var(--card-bg)" }}>
        <h3 className="col-span-full text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Add Word to Pattern</h3>
        <Select label="Pattern" value={patternWordForm.patternId} onChange={(v) => setPatternWordForm({ ...patternWordForm, patternId: v })} options={patternOptions} required />
        <Input label="Word" value={patternWordForm.word} onChange={(v) => setPatternWordForm({ ...patternWordForm, word: v })} placeholder="though" required />
        <Input label="IPA" value={patternWordForm.ipa} onChange={(v) => setPatternWordForm({ ...patternWordForm, ipa: v })} placeholder="/ðoʊ/" />
        <div className="col-span-full flex items-center gap-4">
          <button type="submit" disabled={pwSaving || !patternWordForm.patternId || !patternWordForm.word.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: "var(--primary)", color: "var(--accent-text)" }}>
            {pwSaving ? "Saving…" : "Add word"}
          </button>
          {pwStatus && <StatusBadge ok={pwStatus.ok} message={pwStatus.msg} />}
        </div>
      </form>

      <div className="space-y-4">
        <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
          {patterns.length} patterns — {patternWords.length} pattern words
        </p>
        <Table headers={["ID", "Pattern", "Type", "Sound focus", "Words"]}
          rows={patterns.map((p) => [
            p.id, `"${p.pattern}"`, p.type,
            p.sound_focus ? `/${p.sound_focus}/` : null,
            patternWords.filter((pw) => pw.pattern_id === p.id).length,
          ])} />
      </div>
    </div>
  );
}

// ── Tab: Minimal Pairs ────────────────────────────────────────────────────────

function MinimalPairsTab({ form, setForm }: { form: MinimalPairForm; setForm: (f: MinimalPairForm) => void }) {
  const [sounds, setSounds] = useState<Sound[]>([]);
  const [pairs, setPairs] = useState<MinimalPair[]>([]);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [{ data: s }, { data: p }] = await Promise.all([
      supabase().from("sounds").select("*").order("id"),
      supabase().from("minimal_pairs").select("*").order("id"),
    ]);
    setSounds((s as Sound[]) ?? []);
    setPairs((p as MinimalPair[]) ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.wordA.trim() || !form.wordB.trim()) return;
    setSaving(true); setStatus(null);
    const { error } = await supabase().from("minimal_pairs").insert({
      word_a: form.wordA.trim(), word_b: form.wordB.trim(),
      ipa_a: form.ipaA.trim() || null, ipa_b: form.ipaB.trim() || null,
      sound_group: form.soundGroup.trim() || null,
      sound_a_id: form.soundAId ? Number(form.soundAId) : null,
      sound_b_id: form.soundBId ? Number(form.soundBId) : null,
      contrast_sound_a_id: form.contrastAId ? Number(form.contrastAId) : null,
      contrast_sound_b_id: form.contrastBId ? Number(form.contrastBId) : null,
      contrast_ipa_a: form.contrastIpaA.trim() || null,
      contrast_ipa_b: form.contrastIpaB.trim() || null,
    });
    setSaving(false);
    if (error) { setStatus({ ok: false, msg: error.message }); }
    else {
      setStatus({ ok: true, msg: `Pair "${form.wordA}" / "${form.wordB}" added.` });
      setForm({ wordA: "", wordB: "", ipaA: "", ipaB: "", soundGroup: "", soundAId: "", soundBId: "", contrastAId: "", contrastBId: "", contrastIpaA: "", contrastIpaB: "" });
      load();
    }
  }

  const soundOptions = [
    { value: "", label: "— none —" },
    ...sounds.map((s) => ({ value: String(s.id), label: `/${s.ipa}/ — ${s.category ?? s.type} (id ${s.id})` })),
  ];

  return (
    <div className="space-y-6">
      <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: "var(--surface)", color: "var(--text-secondary)" }}>
        <strong style={{ color: "var(--text-primary)" }}>How minimal pairs work in exercises:</strong>{" "}
        The exercise shows both words and asks the user to pick the one containing the <em>target sound</em>.
        Set <code>contrast_sound_a_id</code> = sound present in word A, and <code>contrast_sound_b_id</code> = sound present in word B.
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl border" style={{ borderColor: "var(--border)", backgroundColor: "var(--card-bg)" }}>
        <h3 className="col-span-full text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Add Minimal Pair</h3>
        <Input label="Word A" value={form.wordA} onChange={(v) => setForm({ ...form, wordA: v })} placeholder="think" required />
        <Input label="Word B" value={form.wordB} onChange={(v) => setForm({ ...form, wordB: v })} placeholder="sink" required />
        <Input label="IPA A" value={form.ipaA} onChange={(v) => setForm({ ...form, ipaA: v })} placeholder="/θɪŋk/" />
        <Input label="IPA B" value={form.ipaB} onChange={(v) => setForm({ ...form, ipaB: v })} placeholder="/sɪŋk/" />
        <Input label="Sound group (label)" value={form.soundGroup} onChange={(v) => setForm({ ...form, soundGroup: v })} placeholder="θ-s" />
        <Select label="Sound A id (word_a)" value={form.soundAId} onChange={(v) => setForm({ ...form, soundAId: v })} options={soundOptions} />
        <Select label="Sound B id (word_b)" value={form.soundBId} onChange={(v) => setForm({ ...form, soundBId: v })} options={soundOptions} />
        <div />
        <Select label="Contrast sound A id ★" value={form.contrastAId} onChange={(v) => setForm({ ...form, contrastAId: v })} options={soundOptions} />
        <Select label="Contrast sound B id ★" value={form.contrastBId} onChange={(v) => setForm({ ...form, contrastBId: v })} options={soundOptions} />
        <Input label="Contrast IPA A" value={form.contrastIpaA} onChange={(v) => setForm({ ...form, contrastIpaA: v })} placeholder="θ" />
        <Input label="Contrast IPA B" value={form.contrastIpaB} onChange={(v) => setForm({ ...form, contrastIpaB: v })} placeholder="s" />
        <div className="col-span-full flex items-center gap-4">
          <button type="submit" disabled={saving || !form.wordA.trim() || !form.wordB.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: "var(--primary)", color: "var(--accent-text)" }}>
            {saving ? "Saving…" : "Add pair"}
          </button>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>★ Required for exercises</p>
          {status && <StatusBadge ok={status.ok} message={status.msg} />}
        </div>
      </form>

      <div>
        <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>{pairs.length} minimal pairs in DB</p>
        <Table headers={["ID", "Word A", "Word B", "IPA A", "IPA B", "Group", "Contrast A id", "Contrast B id"]}
          rows={pairs.map((p) => [p.id, p.word_a, p.word_b, p.ipa_a, p.ipa_b, p.sound_group, p.contrast_sound_a_id, p.contrast_sound_b_id])} />
      </div>
    </div>
  );
}

// ── Gemini Chat ───────────────────────────────────────────────────────────────

interface ChatMessage { role: "user" | "model"; content: string }

type ApplyPayload =
  | { tab: "sounds"; data: Partial<SoundForm> }
  | { tab: "words"; data: Partial<WordForm> }
  | { tab: "patterns"; data: Partial<PatternForm> }
  | { tab: "pattern_words"; data: Partial<PatternWordForm> }
  | { tab: "minimal_pairs"; data: Partial<MinimalPairForm> };

function GeminiChat({ activeTab, sounds, onApply }: {
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

  const tabLabel: Record<Tab, string> = {
    sounds: "Sounds",
    words: "Words",
    patterns: "Patterns",
    minimal_pairs: "Minimal Pairs",
  };

  const soundsContext = sounds.length > 0
    ? `\nAvailable sounds in the database (use these exact IDs for soundId / soundAId / soundBId / contrastAId / contrastBId fields):\n${sounds.map((s) => `  id=${s.id}  /${s.ipa}/  ${s.type}  ${s.category ?? ""}  example: ${s.example ?? "—"}`).join("\n")}\n`
    : "\nNo sounds in the database yet.\n";

  const systemPrompt = `You are an assistant for a language learning app called English Journal.
The admin is currently on the "${tabLabel[activeTab]}" tab of the seed data page.
Your job is to suggest data to insert into the database tables: sounds, words, patterns, pattern_words, and minimal_pairs.
${soundsContext}
When the admin asks for suggestions, respond with a clear explanation AND one or more JSON blocks they can apply.
Each JSON block must be wrapped in a \`\`\`apply\`\`\` code fence with this structure:
\`\`\`apply
{ "tab": "${activeTab}", "data": { ...fields } }
\`\`\`

Field reference:
- sounds: ipa (string), type ("vowel"|"consonant"|"diphthong"), category (string), example (string), difficulty ("1"|"2"|"3")
- words: word (string), ipa (string), soundId (string id from the list above), soundFocus (string ipa), difficulty ("1"|"2"|"3")
- patterns: pattern (string), type ("vowel"|"consonant"|"digraph"|"silent"|"blend"|"diphthong"), focus (string ipa)
- pattern_words: patternId (string id), word (string), ipa (string)
- minimal_pairs: wordA, wordB, ipaA, ipaB, soundGroup, soundAId, soundBId, contrastAId, contrastBId, contrastIpaA, contrastIpaB (all strings)

For minimal_pairs: contrastAId = the ID of the sound present in wordA, contrastBId = the ID of the sound present in wordB. These are the most important fields — always fill them using the sound IDs from the list above.
Keep responses concise. You can suggest multiple items, each in its own \`\`\`apply\`\`\` block.`;

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
        body: JSON.stringify({ messages: newMessages, systemPrompt }),
      });
      const json = await res.json();
      setMessages((prev) => [...prev, { role: "model", content: json.content ?? json.error ?? "No response" }]);
    } catch {
      setMessages((prev) => [...prev, { role: "model", content: "Error connecting to Gemini." }]);
    }
    setLoading(false);
  }

  function parseApplyBlocks(text: string): ApplyPayload[] {
    const regex = /```apply\s*([\s\S]*?)```/g;
    const results: ApplyPayload[] = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      try {
        const payload = JSON.parse(match[1].trim()) as ApplyPayload;
        if (payload.tab && payload.data) results.push(payload);
      } catch { /* ignore malformed blocks */ }
    }
    return results;
  }

  function renderMessage(msg: ChatMessage, idx: number) {
    const isUser = msg.role === "user";
    if (isUser) {
      return (
        <div key={idx} className="flex justify-end">
          <div className="max-w-[80%] px-3 py-2 rounded-2xl rounded-tr-sm text-sm"
            style={{ backgroundColor: "var(--primary)", color: "var(--accent-text)" }}>
            {msg.content}
          </div>
        </div>
      );
    }

    const applyBlocks = parseApplyBlocks(msg.content);
    // Render text without the apply blocks
    const cleanText = msg.content.replace(/```apply[\s\S]*?```/g, "").trim();

    return (
      <div key={idx} className="flex flex-col gap-2">
        {cleanText && (
          <div className="max-w-[90%] px-3 py-2 rounded-2xl rounded-tl-sm text-sm whitespace-pre-wrap"
            style={{ backgroundColor: "var(--surface)", color: "var(--text-primary)" }}>
            {cleanText}
          </div>
        )}
        {applyBlocks.map((block, bi) => (
          <div key={bi} className="max-w-[90%] rounded-xl border p-3 flex flex-col gap-2"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--card-bg)" }}>
            <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
              Suggestion for <span style={{ color: "var(--primary)" }}>{tabLabel[block.tab as Tab] ?? block.tab}</span>
            </p>
            <pre className="text-xs overflow-x-auto" style={{ color: "var(--text-primary)" }}>
              {JSON.stringify(block.data, null, 2)}
            </pre>
            <button
              onClick={() => onApply(block)}
              className="self-start px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              style={{ backgroundColor: "var(--primary)", color: "var(--accent-text)" }}
            >
              Apply to form
            </button>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Floating button */}
      <button
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
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 w-96 flex flex-col rounded-2xl shadow-2xl border overflow-hidden"
          style={{ height: "520px", backgroundColor: "var(--card-bg)", borderColor: "var(--border)" }}
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "var(--primary)" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>AI Seed Assistant</span>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--btn-regular-bg)", color: "var(--primary)" }}>
              {tabLabel[activeTab]}
            </span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-sm text-center mt-8" style={{ color: "var(--text-tertiary)" }}>
                <p className="mb-1">Ask me to suggest data for the <strong>{tabLabel[activeTab]}</strong> tab.</p>
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

          {/* Input */}
          <div className="p-3 border-t flex gap-2" style={{ borderColor: "var(--border)" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Ask for suggestions…"
              className="flex-1 px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2"
              style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-40"
              style={{ backgroundColor: "var(--primary)", color: "var(--accent-text)" }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string }[] = [
  { id: "sounds",        label: "Sounds" },
  { id: "words",         label: "Words" },
  { id: "patterns",      label: "Patterns" },
  { id: "minimal_pairs", label: "Minimal Pairs" },
];

const DEFAULT_SOUND_FORM: SoundForm = { ipa: "", type: "vowel", category: "", example: "", difficulty: "1" };
const DEFAULT_WORD_FORM: WordForm = { word: "", ipa: "", soundId: "", soundFocus: "", difficulty: "1" };
const DEFAULT_PATTERN_FORM: PatternForm = { pattern: "", type: "vowel", focus: "" };
const DEFAULT_PATTERN_WORD_FORM: PatternWordForm = { patternId: "", word: "", ipa: "" };
const DEFAULT_MP_FORM: MinimalPairForm = { wordA: "", wordB: "", ipaA: "", ipaB: "", soundGroup: "", soundAId: "", soundBId: "", contrastAId: "", contrastBId: "", contrastIpaA: "", contrastIpaB: "" };

export default function SeedPage() {
  const [tab, setTab] = useState<Tab>("sounds");
  const [allSounds, setAllSounds] = useState<Sound[]>([]);

  useEffect(() => {
    supabase().from("sounds").select("*").order("id")
      .then(({ data }) => setAllSounds((data as Sound[]) ?? []));
  }, []);

  // Form states lifted up so AI can populate them
  const [soundForm, setSoundForm] = useState<SoundForm>(DEFAULT_SOUND_FORM);
  const [wordForm, setWordForm] = useState<WordForm>(DEFAULT_WORD_FORM);
  const [patternForm, setPatternForm] = useState<PatternForm>(DEFAULT_PATTERN_FORM);
  const [patternWordForm, setPatternWordForm] = useState<PatternWordForm>(DEFAULT_PATTERN_WORD_FORM);
  const [mpForm, setMpForm] = useState<MinimalPairForm>(DEFAULT_MP_FORM);

  function handleApply(payload: ApplyPayload) {
    // Switch to the relevant tab first
    if (payload.tab === "pattern_words") {
      setTab("patterns");
      setPatternWordForm((prev) => ({ ...prev, ...payload.data }));
    } else {
      setTab(payload.tab);
      if (payload.tab === "sounds") setSoundForm((prev) => ({ ...prev, ...payload.data }));
      if (payload.tab === "words") setWordForm((prev) => ({ ...prev, ...payload.data }));
      if (payload.tab === "patterns") setPatternForm((prev) => ({ ...prev, ...payload.data }));
      if (payload.tab === "minimal_pairs") setMpForm((prev) => ({ ...prev, ...payload.data }));
    }
  }

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
            <button key={t.id} onClick={() => setTab(t.id)}
              className="px-4 py-2.5 text-sm font-medium transition-colors relative"
              style={{
                color: tab === t.id ? "var(--primary)" : "var(--text-secondary)",
                borderBottom: tab === t.id ? "2px solid var(--primary)" : "2px solid transparent",
              }}>
              {t.label}
            </button>
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

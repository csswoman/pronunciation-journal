"use client";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import StatusBadge from "@/components/ui/StatusBadge";
import Table from "@/components/ui/Table";
import { useWordsTab } from "@/app/admin/seed/useWordsTab";
import type { WordForm } from "@/lib/admin/seed/types";

export function WordsTab({ form, setForm }: { form: WordForm; setForm: (f: WordForm) => void }) {
  const { sounds, words, filterSound, setFilterSound, status, saving, displayed, soundOptions, handleSubmit } = useWordsTab({ form, setForm });

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
          <Button type="submit" disabled={saving || !form.word.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: "var(--primary)", color: "var(--accent-text)" }}>
            {saving ? "Saving…" : "Add word"}
          </Button>
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

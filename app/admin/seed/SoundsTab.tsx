"use client";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import StatusBadge from "@/components/ui/StatusBadge";
import Table from "@/components/ui/Table";
import type { SoundForm } from "@/lib/admin/seed/types";
import { useSoundsTab } from "@/app/admin/seed/useSoundsTab";

export function SoundsTab({
  form,
  setForm,
}: {
  form: SoundForm;
  setForm: (f: SoundForm) => void;
}) {
  const { sounds, status, saving, handleSubmit } = useSoundsTab({ form, setForm });

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 rounded-xl border"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--card-bg)" }}
      >
        <h3 className="col-span-full text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Add Sound
        </h3>
        <Input label="IPA symbol" value={form.ipa} onChange={(v) => setForm({ ...form, ipa: v })} placeholder="æ" required />
        <Select
          label="Type"
          value={form.type}
          onChange={(v) => setForm({ ...form, type: v })}
          options={[
            { value: "vowel", label: "Vowel" },
            { value: "consonant", label: "Consonant" },
            { value: "diphthong", label: "Diphthong" },
          ]}
          required
        />
        <Input label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v })} placeholder="short vowel" />
        <Input label="Example word" value={form.example} onChange={(v) => setForm({ ...form, example: v })} placeholder="cat" />
        <Select
          label="Difficulty (1–3)"
          value={form.difficulty}
          onChange={(v) => setForm({ ...form, difficulty: v })}
          options={[
            { value: "1", label: "1 — Easy" },
            { value: "2", label: "2 — Medium" },
            { value: "3", label: "3 — Hard" },
          ]}
        />
        <div className="col-span-full flex items-center gap-4">
          <Button
            type="submit"
            disabled={saving || !form.ipa.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: "var(--primary)", color: "var(--accent-text)" }}
          >
            {saving ? "Saving…" : "Add sound"}
          </Button>
          {status && <StatusBadge ok={status.ok} message={status.msg} />}
        </div>
      </form>
      <div>
        <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
          {sounds.length} sounds in DB
        </p>
        <Table
          headers={["ID", "IPA", "Type", "Category", "Example", "Difficulty"]}
          rows={sounds.map((s) => [s.id, `/${s.ipa}/`, s.type, s.category, s.example, s.difficulty])}
        />
      </div>
    </div>
  );
}

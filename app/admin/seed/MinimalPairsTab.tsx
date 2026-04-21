"use client";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import StatusBadge from "@/components/ui/StatusBadge";
import Table from "@/components/ui/Table";
import { useMinimalPairsTab } from "@/app/admin/seed/useMinimalPairsTab";
import type { MinimalPairForm } from "@/lib/admin/seed/types";

export function MinimalPairsTab({ form, setForm }: { form: MinimalPairForm; setForm: (f: MinimalPairForm) => void }) {
  const { pairs, status, saving, soundOptions, handleSubmit } = useMinimalPairsTab({ form, setForm });

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
          <Button type="submit" disabled={saving || !form.wordA.trim() || !form.wordB.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: "var(--primary)", color: "var(--accent-text)" }}>
            {saving ? "Saving…" : "Add pair"}
          </Button>
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

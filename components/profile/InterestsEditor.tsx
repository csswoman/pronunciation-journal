'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import { INTEREST_OPTIONS, type Interest } from '@/lib/users/interests'

const labels: Record<Interest, string> = {
  technology: 'Tecnología', travel: 'Viajes', work: 'Trabajo', food: 'Comida',
  music: 'Música', films: 'Películas', books: 'Libros', sports: 'Deportes',
  health: 'Salud', science: 'Ciencia', business: 'Negocios', gaming: 'Videojuegos',
}

export default function InterestsEditor({ interests, onSave }: {
  interests: readonly Interest[]
  onSave: (interests: Interest[]) => Promise<void>
}) {
  const [selected, setSelected] = useState<Interest[]>([...interests])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const toggle = (interest: Interest) => setSelected((current) =>
    current.includes(interest) ? current.filter((value) => value !== interest) : current.length < 10 ? [...current, interest] : current,
  )
  const save = async () => {
    try { setSaving(true); setError(''); await onSave(selected) }
    catch { setError('No se pudieron guardar los intereses.') }
    finally { setSaving(false) }
  }
  return <section aria-labelledby="interests-title" className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5 space-y-3">
    <div><h2 id="interests-title" className="text-sm font-semibold text-fg m-0">Intereses</h2><p className="text-xs text-fg-muted m-0">Personalizan futuras lecturas y práctica. Máximo 10.</p></div>
    <div className="flex flex-wrap gap-2">{INTEREST_OPTIONS.map((interest) => <button key={interest} type="button" aria-pressed={selected.includes(interest)} onClick={() => toggle(interest)} className={selected.includes(interest) ? 'rounded-full bg-primary px-3 py-1 text-xs font-medium text-on-primary' : 'rounded-full border border-border-default px-3 py-1 text-xs text-fg'}>{labels[interest]}</button>)}</div>
    {error && <p className="text-xs text-error">{error}</p>}
    <Button type="button" variant="primary" size="sm" disabled={saving} onClick={save}>{saving ? 'Guardando…' : 'Guardar intereses'}</Button>
  </section>
}

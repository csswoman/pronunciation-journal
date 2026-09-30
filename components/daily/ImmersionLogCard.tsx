'use client';

import { useState } from 'react';
import { Video, Tv, Headphones, BookOpen, Check } from '@/components/icons';
import { useAuthOptional } from '@/components/auth/AuthProvider';
import { logExternalImmersion } from '@/lib/immersion/external-log';
import type { ImmersionMediaType } from '@/lib/progress/activity-types';

interface ImmersionLogCardProps {
  onLogImmersion?: (data: { type: ImmersionMediaType; minutes: number; notes: string }) => void;
}

export function ImmersionLogCard({ onLogImmersion }: ImmersionLogCardProps) {
  const auth = useAuthOptional();
  const userId = auth?.user?.id ?? null;
  const [minutes, setMinutes] = useState(30);
  const [mediaType, setMediaType] = useState<ImmersionMediaType>('video');
  const [notes, setNotes] = useState('');
  const [logged, setLogged] = useState(false);

  async function handleSave() {
    if (userId) {
      try {
        await logExternalImmersion(userId, {
          type: mediaType,
          minutes,
          notes: notes.trim() || undefined,
        });
      } catch (err) {
        console.error('[ImmersionLogCard] Error logging immersion:', err);
      }
    }

    onLogImmersion?.({
      type: mediaType,
      minutes,
      notes,
    });
    setLogged(true);
    setTimeout(() => {
      setLogged(false);
      setNotes('');
    }, 4000);
  }

  const CATEGORIES: Array<{ id: ImmersionMediaType; label: string; icon: typeof Video }> = [
    { id: 'video', label: 'Video', icon: Video },
    { id: 'series', label: 'Serie', icon: Tv },
    { id: 'podcast', label: 'Podcast', icon: Headphones },
    { id: 'reading', label: 'Lectura', icon: BookOpen },
  ];

  return (
    <div className="flex flex-col gap-4 sm:gap-4.5 rounded-3xl border border-border-subtle bg-surface-raised p-4 sm:p-5 shadow-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <Video size={20} aria-hidden />
          </div>
          <div className="flex flex-col min-w-0">
            <h3 className="ts-row-title font-bold text-fg truncate">
              ¿Viste o escuchaste algo en inglés?
            </h3>
            <p className="ts-caption text-fg-muted truncate">
              Regístralo y cuenta como exposición real.
            </p>
          </div>
        </div>

        <span className="inline-flex items-center rounded-full border border-border-subtle bg-surface-sunken px-3.5 py-1 ts-pill font-semibold text-fg-muted">
          0 min esta semana
        </span>
      </div>

      {/* Selector de categorías estilo tarjeta */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = mediaType === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setMediaType(cat.id)}
              className={`press-feedback focus-ring flex min-h-12 items-center gap-2.5 rounded-xl p-2 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[var(--coral)] border border-ink text-ink shadow-xs'
                  : 'bg-surface-raised border border-border-default text-fg hover:bg-surface-sunken'
              }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  isSelected ? 'bg-ink/10 text-ink' : 'bg-surface-sunken text-fg'
                }`}
              >
                <Icon size={17} aria-hidden />
              </div>
              <span className="ts-chip font-bold">{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Controles de tiempo, notas y acción de registro */}
      <div className="flex flex-wrap items-center gap-3 pt-0.5">
        {/* Selector de tiempo */}
        <div className="flex items-center gap-2.5">
          <span className="ts-caption font-medium text-fg-muted whitespace-nowrap">
            Cuánto tiempo
          </span>
          <div className="flex items-center gap-1 rounded-full bg-surface-sunken p-1 border border-border-subtle">
            {[15, 30, 45, 60].map((m) => {
              const isSel = minutes === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMinutes(m)}
                  className={`focus-ring rounded-full px-3 py-1 ts-pill transition-all cursor-pointer ${
                    isSel
                      ? 'bg-accent text-on-accent font-bold shadow-xs'
                      : 'text-fg-muted hover:text-fg font-medium'
                  }`}
                >
                  {isSel ? `${m} min` : m}
                </button>
              );
            })}
          </div>
        </div>

        {/* Campo de notas opcional */}
        <input
          type="text"
          placeholder="Título del video, serie o canal (opcional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="min-w-[200px] flex-1 rounded-2xl border border-border-subtle bg-surface-sunken/80 px-4 py-2 ts-body text-fg placeholder:text-fg-muted focus-ring"
        />

        {/* Botón registrar */}
        <button
          type="button"
          onClick={handleSave}
          disabled={logged}
          className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-accent px-5 py-2 ts-button font-bold text-on-accent shadow-sm hover:bg-primary-hover transition-colors cursor-pointer whitespace-nowrap"
        >
          {logged ? (
            <>
              <Check size={16} className="text-on-accent" />
              <span>Registrado</span>
            </>
          ) : (
            <span>Registrar {minutes} min</span>
          )}
        </button>
      </div>
    </div>
  );
}

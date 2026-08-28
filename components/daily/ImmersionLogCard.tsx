'use client';

import { useState } from 'react';
import { Clapperboard, Check, Timer } from '@/components/icons';
import Button from '@/components/ui/Button';

interface ImmersionLogCardProps {
  onLogImmersion?: (data: { type: string; minutes: number; notes: string }) => void;
}

export function ImmersionLogCard({ onLogImmersion }: ImmersionLogCardProps) {
  const [minutes, setMinutes] = useState(30);
  const [mediaType, setMediaType] = useState<'video' | 'podcast' | 'reading' | 'series'>('video');
  const [notes, setNotes] = useState('');
  const [logged, setLogged] = useState(false);

  function handleSave() {
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

  return (
    <div className="flex flex-col gap-3 rounded-card-interactive border border-border-default bg-surface-raised p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-border-default/60 pb-2.5">
        <div className="flex items-center gap-2">
          <Clapperboard className="size-4 text-primary" />
          <h3 className="font-semibold text-fg text-body-sm">
            Registrar Inmersión Externa (Input Libre)
          </h3>
        </div>
        <span className="text-tiny text-fg-muted">Krashen</span>
      </div>

      <p className="text-tiny text-fg-muted">
        ¿Viste una serie, video de YouTube o escuchaste un podcast en inglés hoy? Regístralo para contabilizar tu exposición real:
      </p>

      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: 'video', label: 'YouTube / Video' },
            { id: 'series', label: 'Serie / Película' },
            { id: 'podcast', label: 'Podcast' },
            { id: 'reading', label: 'Lectura de Libro' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setMediaType(t.id)}
            className={`rounded-md px-3 py-1.5 text-tiny font-medium transition-colors focus-ring ${
              mediaType === t.id
                ? 'bg-primary-soft text-primary font-bold border border-primary/30'
                : 'bg-surface-sunken text-fg-muted hover:text-fg border border-border-default'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Minutes selector */}
      <div className="flex items-center gap-2">
        <span className="text-tiny text-fg-muted">Tiempo:</span>
        {[15, 30, 45, 60].map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMinutes(m)}
            className={`rounded px-2.5 py-1 font-mono text-tiny font-medium transition-colors focus-ring ${
              minutes === m
                ? 'bg-primary text-white font-bold'
                : 'bg-surface-sunken text-fg-muted hover:bg-surface-raised border border-border-default'
            }`}
          >
            {m} min
          </button>
        ))}
      </div>

      {/* Optional notes */}
      <input
        type="text"
        placeholder="Título del video, serie o canal (opcional)..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="w-full rounded-md border border-border-default bg-surface-sunken px-3 py-1.5 text-body-sm text-fg placeholder:text-fg-muted focus-ring"
      />

      <div className="flex justify-end pt-1">
        <Button
          variant={logged ? 'outline' : 'primary'}
          size="sm"
          onClick={handleSave}
          disabled={logged}
          className="flex items-center gap-1.5"
        >
          {logged ? (
            <>
              <Check className="size-3.5 text-success" />
              <span>¡Inmersión Registrada!</span>
            </>
          ) : (
            <>
              <Timer className="size-3.5" />
              <span>Registrar {minutes} min de Inmersión</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

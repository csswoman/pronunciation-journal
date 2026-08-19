'use client';

import { Sparkles, Timer } from '@/components/icons';
import Badge from '@/components/ui/Badge';

export type DailyRoutinePreset = 'salas-60' | 'standard-30' | 'express-15';

interface RoutinePresetSelectorProps {
  currentPreset: DailyRoutinePreset;
  onSelectPreset: (preset: DailyRoutinePreset) => void;
  silentPeriodMode: boolean;
  onToggleSilentPeriod: (enabled: boolean) => void;
}

export function RoutinePresetSelector({
  currentPreset,
  onSelectPreset,
  silentPeriodMode,
  onToggleSilentPeriod,
}: RoutinePresetSelectorProps) {
  const PRESETS: {
    id: DailyRoutinePreset;
    title: string;
    duration: string;
    badge?: string;
    description: string;
    blocks: string[];
  }[] = [
    {
      id: 'salas-60',
      title: 'Método Mr. Salas (Adquisición)',
      duration: '60 min',
      badge: 'Recomendado',
      description: 'Enfocado en comprensión natural e inmersión sin forzar el habla temprana.',
      blocks: ['15m Vocabulario SRS', '15m Reader & Shadowing', '30m Inmersión EngVid'],
    },
    {
      id: 'standard-30',
      title: 'Práctica Balanceada',
      duration: '30 min',
      description: 'Rutina ágil para mantener consistencia y repetición espaciada.',
      blocks: ['10m Vocabulario', '10m Lectura en Contexto', '10m Fonética'],
    },
    {
      id: 'express-15',
      title: 'Sesión Exprés',
      duration: '15 min',
      description: 'Mantenimiento rápido para días ocupados sin romper tu hábito.',
      blocks: ['5m Repaso SRS', '10m Lectura guiada'],
    },
  ];

  return (
    <div className="flex flex-col gap-4 rounded-card-interactive border border-border-default bg-surface-raised p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-default/60 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <h2 className="font-semibold text-fg text-body">Estructura de tu Sesión de Hoy</h2>
        </div>

        {/* Silent Period / No Mic Toggle */}
        <div className="flex items-center gap-2">
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={silentPeriodMode}
              onChange={(e) => onToggleSilentPeriod(e.target.checked)}
              className="peer sr-only"
            />
            <div className="peer h-5 w-9 rounded-full bg-surface-sunken after:absolute after:top-0.5 after:left-0.5 after:h-4 after:w-4 after:rounded-full after:bg-fg-muted after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:bg-white peer-focus:outline-none" />
          </label>
          <span className="text-tiny font-medium text-fg-muted">
            Modo Silencioso (Solo Escucha)
          </span>
        </div>
      </div>

      {/* Presets Grid */}
      <div className="grid gap-3 sm:grid-cols-3">
        {PRESETS.map((p) => {
          const isSelected = currentPreset === p.id;

          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelectPreset(p.id)}
              className={`flex flex-col justify-between gap-3 rounded-lg border p-3.5 text-left transition-all focus-ring ${
                isSelected
                  ? 'border-primary bg-primary-soft/30 shadow-xs ring-1 ring-primary'
                  : 'border-border-default bg-surface-sunken hover:border-primary/40 hover:bg-surface-raised'
              }`}
            >
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-semibold text-fg text-body-sm">{p.title}</span>
                  {p.badge && <Badge label={p.badge} variant="default" size="sm" />}
                </div>

                <div className="flex items-center gap-1 font-mono text-tiny font-medium text-primary">
                  <Timer className="size-3" />
                  <span>{p.duration}</span>
                </div>

                <p className="text-tiny text-fg-muted">{p.description}</p>
              </div>

              {/* Steps overview */}
              <div className="flex flex-col gap-1 border-t border-border-default/50 pt-2 text-tiny font-medium text-fg-subtle">
                {p.blocks.map((block, idx) => (
                  <span key={idx} className="flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-primary/60" />
                    <span>{block}</span>
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

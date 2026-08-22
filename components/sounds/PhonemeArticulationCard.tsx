'use client';

import { Volume2, AlertCircle, Sparkles } from '@/components/icons';
import Badge from '@/components/ui/Badge';
import { speakWord } from '@/lib/word-bank/speech';
import type { ArticulationGuide } from '@/lib/sounds/articulation-guides';

interface PhonemeArticulationCardProps {
  guide: ArticulationGuide;
}

export function PhonemeArticulationCard({ guide }: PhonemeArticulationCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-card-interactive border border-border-default bg-surface-raised p-4 shadow-sm sm:p-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-default/60 pb-3">
        <div className="flex items-center gap-3">
          <span className="font-ipa text-display-xs font-bold text-primary">
            {guide.phoneme}
          </span>
          <div>
            <h3 className="font-semibold text-fg text-body">{guide.name}</h3>
            <p className="text-tiny text-fg-muted">
              {guide.type === 'vowel' ? 'Vocal' : 'Consonante'} • {guide.voiced ? 'Sonora (Vibración)' : 'Sorda (Solo aire)'}
            </p>
          </div>
        </div>

        <Badge
          label={guide.voiced ? 'Vocal Cords: ON' : 'Vocal Cords: OFF'}
          variant={guide.voiced ? "success" : "neutral"}
          size="sm"
        />
      </div>

      {/* Anatomy / SVG Visual Schematic */}
      <div className="flex flex-col items-center justify-center rounded-lg border border-border-default bg-surface-sunken p-4 text-center">
        <svg
          viewBox="0 0 200 120"
          className="h-28 w-auto text-primary"
          aria-hidden="true"
        >
          {/* Head silhouette schematic */}
          <path
            d="M 30,20 Q 80,10 130,20 Q 170,40 170,80 Q 160,110 120,110 L 80,110"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="4 4"
            className="text-fg-subtle"
          />

          {/* Hard Palate & Upper Teeth */}
          <path
            d="M 60,40 Q 100,35 130,50 L 132,60"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-fg"
          />

          {/* Specific Tongue Positioning per diagram type */}
          {guide.diagramType === 'interdental' && (
            <>
              {/* Tongue between teeth */}
              <path
                d="M 60,85 Q 90,80 138,58 Q 142,62 135,68 Q 95,88 60,95"
                fill="var(--primary)"
                fillOpacity="0.25"
                stroke="var(--primary)"
                strokeWidth="2.5"
              />
              {/* Airflow arrows */}
              <path d="M 136,54 L 155,50" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" />
            </>
          )}

          {guide.diagramType === 'labiodental' && (
            <>
              {/* Teeth on bottom lip */}
              <path
                d="M 60,85 Q 90,80 120,80 Q 130,75 132,65"
                fill="var(--primary)"
                fillOpacity="0.25"
                stroke="var(--primary)"
                strokeWidth="2.5"
              />
              <circle cx="132" cy="62" r="3" fill="var(--primary)" />
            </>
          )}

          {guide.diagramType === 'vowel-high-front' && (
            <>
              {/* High front arched tongue */}
              <path
                d="M 60,90 Q 95,45 125,52 Q 100,85 60,95"
                fill="var(--primary)"
                fillOpacity="0.25"
                stroke="var(--primary)"
                strokeWidth="2.5"
              />
            </>
          )}

          {guide.diagramType === 'vowel-lax-front' && (
            <>
              {/* Mid-high relaxed tongue */}
              <path
                d="M 60,90 Q 95,60 120,65 Q 100,88 60,95"
                fill="var(--primary)"
                fillOpacity="0.25"
                stroke="var(--primary)"
                strokeWidth="2.5"
              />
            </>
          )}

          {guide.diagramType === 'vowel-open' && (
            <>
              {/* Flat low tongue */}
              <path
                d="M 60,92 Q 100,88 125,85 Q 95,95 60,95"
                fill="var(--primary)"
                fillOpacity="0.25"
                stroke="var(--primary)"
                strokeWidth="2.5"
              />
            </>
          )}

          {guide.diagramType === 'schwa' && (
            <>
              {/* Completely central neutral tongue */}
              <circle cx="95" cy="65" r="14" fill="var(--primary)" fillOpacity="0.2" stroke="var(--primary)" strokeWidth="2" strokeDasharray="3 3" />
            </>
          )}
        </svg>

        <p className="mt-2 text-tiny font-medium text-fg">
          {guide.tonguePosition}
        </p>
      </div>

      {/* Mechanics Grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1 rounded-md border border-border-default bg-surface-sunken p-3">
          <span className="text-tiny font-semibold text-primary uppercase tracking-wider">
            👄 Labios y Mandíbula
          </span>
          <p className="text-tiny text-fg-muted">{guide.lipsPosition}</p>
        </div>

        <div className="flex flex-col gap-1 rounded-md border border-border-default bg-surface-sunken p-3">
          <span className="text-tiny font-semibold text-primary uppercase tracking-wider">
            🌬️ Flujo de Aire
          </span>
          <p className="text-tiny text-fg-muted">{guide.airflow}</p>
        </div>
      </div>

      {/* Spanish Trap Warning */}
      <div className="flex items-start gap-2.5 rounded-lg border border-warning/30 bg-badge-warning-bg p-3.5 text-tiny text-warning">
        <AlertCircle className="size-4 shrink-0 text-warning mt-0.5" />
        <div>
          <strong className="block font-semibold text-fg">Trampa común para hispanohablantes:</strong>
          <span>{guide.spanishTrap}</span>
        </div>
      </div>

      {/* Biomechanical Tip */}
      <div className="flex items-start gap-2.5 rounded-lg border border-primary/30 bg-primary-soft/30 p-3.5 text-tiny text-fg">
        <Sparkles className="size-4 shrink-0 text-primary mt-0.5" />
        <div>
          <strong className="block font-semibold text-primary">Consejo físico de autocomprobación:</strong>
          <span className="text-fg-muted">{guide.biomechanicsTip}</span>
        </div>
      </div>

      {/* Key Example Words */}
      <div className="flex flex-col gap-2 pt-1 border-t border-border-default/60">
        <span className="text-tiny font-semibold text-fg-muted">Palabras de referencia para calibrar tu oído:</span>
        <div className="grid grid-cols-3 gap-2">
          {guide.keyWords.map((kw, i) => (
            <button
              key={i}
              type="button"
              onClick={() => speakWord(kw.word)}
              className="flex flex-col items-center justify-center rounded-md border border-border-default bg-surface-sunken p-2 transition-colors hover:border-primary/50 hover:bg-surface-raised focus-ring"
            >
              <div className="flex items-center gap-1 font-semibold text-fg text-body-sm">
                <span>{kw.word}</span>
                <Volume2 className="size-3 text-fg-muted" />
              </div>
              <span className="font-ipa text-tiny text-primary">{kw.ipa}</span>
              <span className="text-caption text-fg-subtle">{kw.translation}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

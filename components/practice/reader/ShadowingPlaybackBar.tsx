'use client';

// Planned structure:
// <ShadowingPlaybackBar>
//   <PlaybackModeAndSpeedRow />
//   <PlaybackControlsRow />
//   <ConnectedSpeechTips />
// </ShadowingPlaybackBar>

import { Play, Pause, SkipForward, Undo2, Volume2, Mic } from '@/components/icons';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import type { SentenceSegment } from '@/lib/speech/shadowing';

export type PlaybackPhase = 'idle' | 'listening' | 'echoing';

interface Props {
  isShadowingMode: boolean;
  onToggleShadowingMode: (enabled: boolean) => void;
  playbackRate: number;
  onSelectPlaybackRate: (rate: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onRepeat: () => void;
  onNext: () => void;
  online: boolean;
  totalSentences: number;
  activeSentenceIdx: number | null;
  phase: PlaybackPhase;
  currentSegment: SentenceSegment | null;
}

const SPEED_OPTIONS = [0.75, 0.9, 1.0, 1.25];

export function ShadowingPlaybackBar({
  isShadowingMode,
  onToggleShadowingMode,
  playbackRate,
  onSelectPlaybackRate,
  isPlaying,
  onTogglePlay,
  onRepeat,
  onNext,
  online,
  totalSentences,
  activeSentenceIdx,
  phase,
  currentSegment,
}: Props) {
  return (
    <div className="flex flex-col gap-3 rounded-card-interactive border border-border-default bg-surface-raised p-4 shadow-xs">
      {/* Header with Mode Toggle & Speed Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-default/60 pb-3">
        <div className="flex items-center gap-2">
          <label className="relative inline-flex cursor-pointer items-center gap-2.5 select-none">
            <input
              type="checkbox"
              role="switch"
              aria-checked={isShadowingMode}
              checked={isShadowingMode}
              onChange={(e) => onToggleShadowingMode(e.target.checked)}
              className="peer sr-only"
            />
            <div className="peer relative h-6 w-11 rounded-full bg-surface-sunken border border-border-default transition-colors duration-200 after:absolute after:top-0.5 after:left-0.5 after:h-4.5 after:w-4.5 after:rounded-full after:bg-white after:shadow-xs after:transition-transform after:duration-200 after:content-[''] peer-checked:bg-primary peer-checked:border-primary peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40" />
            <span className="text-body-sm font-medium text-fg">
              {isShadowingMode ? 'Modo Shadowing (Eco con pausas)' : 'Lectura bimodal continua'}
            </span>
          </label>
        </div>

        {/* Speed Selector as Apple-style Segmented Control */}
        <div className="flex items-center gap-2">
          <span className="text-caption text-fg-muted">Velocidad:</span>
          <div
            role="radiogroup"
            aria-label="Velocidad de reproducción"
            className="inline-flex items-center rounded-full bg-surface-sunken p-0.5 border border-border-subtle"
          >
            {SPEED_OPTIONS.map((rate) => {
              const isActive = playbackRate === rate;
              return (
                <button
                  key={rate}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  onClick={() => onSelectPlaybackRate(rate)}
                  className={cn(
                    'rounded-full px-2.5 py-1 font-mono text-tiny transition-all duration-150 focus-ring cursor-pointer select-none',
                    isActive
                      ? 'bg-surface-raised text-primary font-bold shadow-xs'
                      : 'text-fg-muted hover:text-fg'
                  )}
                >
                  {rate}x
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Playback Bar & Phase Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant={isPlaying ? 'secondary' : 'primary'}
            size="sm"
            onClick={onTogglePlay}
            disabled={!online || totalSentences === 0}
            className="flex items-center gap-1.5 active:scale-95 transition-all shadow-xs cursor-pointer"
          >
            {isPlaying ? (
              <>
                <Pause className="size-4" />
                <span>Pausar</span>
              </>
            ) : (
              <>
                <Play className="size-4" />
                <span>
                  {activeSentenceIdx !== null
                    ? 'Reanudar'
                    : isShadowingMode
                    ? 'Iniciar Shadowing'
                    : 'Iniciar Lectura'}
                </span>
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onRepeat}
            disabled={!online || activeSentenceIdx === null}
            title="Repetir oración actual"
            aria-label="Repetir oración actual"
            className="size-9 p-0 flex items-center justify-center rounded-full hover:bg-surface-sunken active:scale-90 transition-all cursor-pointer"
          >
            <Undo2 className="size-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onNext}
            disabled={!online || (activeSentenceIdx !== null && activeSentenceIdx >= totalSentences - 1)}
            title="Siguiente oración"
            aria-label="Siguiente oración"
            className="size-9 p-0 flex items-center justify-center rounded-full hover:bg-surface-sunken active:scale-90 transition-all cursor-pointer"
          >
            <SkipForward className="size-4" />
          </Button>
        </div>

        {/* Dynamic Status, Sentence Progress & Phase Badge */}
        <div className="flex items-center gap-2">
          {totalSentences > 0 && (
            <div className="flex items-center gap-2 text-tiny text-fg-muted font-mono bg-surface-sunken px-2.5 py-1 rounded-full border border-border-subtle">
              <span>
                {activeSentenceIdx !== null ? activeSentenceIdx + 1 : 0}/{totalSentences}
              </span>
              <div className="h-1.5 w-12 rounded-full bg-border-default overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{
                    width: `${
                      activeSentenceIdx !== null
                        ? Math.round(((activeSentenceIdx + 1) / totalSentences) * 100)
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          )}

          {phase === 'listening' && (
            <span className="flex items-center gap-1.5 rounded-full bg-badge-info-bg px-3 py-1 text-tiny font-semibold text-info animate-pulse border border-badge-info-border">
              <Volume2 className="size-3.5" />
              <span>Escuchando pronunciación nativa…</span>
            </span>
          )}

          {phase === 'echoing' && (
            <span className="flex items-center gap-1.5 rounded-full bg-badge-success-bg px-3 py-1 text-tiny font-semibold text-success animate-pulse border border-badge-success-border">
              <Mic className="size-3.5" />
              <span>Tu turno · Repite en voz alta</span>
            </span>
          )}
        </div>
      </div>

      {/* Connected Speech Tips for Active Sentence */}
      {currentSegment?.connectedSpeechNotes && currentSegment.connectedSpeechNotes.length > 0 && (
        <div className="rounded-card border border-primary/20 bg-primary-soft/40 p-3 text-tiny text-fg">
          <p className="font-semibold text-primary mb-1">💡 Consejos de enlace (Connected Speech):</p>
          <ul className="list-disc list-inside space-y-0.5 text-fg-muted">
            {currentSegment.connectedSpeechNotes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

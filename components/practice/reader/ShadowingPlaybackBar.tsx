'use client';

// Planned structure:
// <ShadowingPlaybackBar>
//   <PlaybackModeAndSpeedRow />
//   <PlaybackControlsRow />
//   <ConnectedSpeechTips />
// </ShadowingPlaybackBar>

import { Play, Pause, SkipForward, Undo2, Volume2, Timer } from '@/components/icons';
import Button from '@/components/ui/Button';
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
    <div className="flex flex-col gap-3 rounded-card-interactive border border-border-default bg-surface-raised p-4 shadow-sm">
      {/* Header with Mode Toggle & Speed Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-default/60 pb-3">
        <div className="flex items-center gap-2">
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={isShadowingMode}
              onChange={(e) => onToggleShadowingMode(e.target.checked)}
              className="peer sr-only"
            />
            <div className="peer h-5 w-9 rounded-full bg-surface-sunken after:absolute after:top-0.5 after:left-0.5 after:h-4 after:w-4 after:rounded-full after:bg-fg-muted after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:bg-white peer-focus:outline-none" />
          </label>
          <span className="text-body-sm font-semibold text-fg">
            {isShadowingMode ? 'Modo Shadowing (Eco con pausas)' : 'Lectura bimodal continua'}
          </span>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-tiny text-fg-muted">Velocidad:</span>
          {SPEED_OPTIONS.map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => onSelectPlaybackRate(rate)}
              className={`rounded px-2 py-0.5 font-mono text-tiny font-medium transition-colors focus-ring cursor-pointer ${
                playbackRate === rate
                  ? 'bg-primary-soft text-primary font-bold'
                  : 'text-fg-muted hover:bg-surface-sunken hover:text-fg'
              }`}
            >
              {rate}x
            </button>
          ))}
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
            className="flex items-center gap-1.5"
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
          >
            <SkipForward className="size-4" />
          </Button>
        </div>

        {/* Dynamic Status / Phase Badge */}
        <div className="flex items-center gap-2">
          {phase === 'listening' && (
            <span className="flex items-center gap-1.5 rounded-full bg-badge-info-bg px-2.5 py-1 text-tiny font-semibold text-info animate-pulse">
              <Volume2 className="size-3.5" />
              <span>Escucha la pronunciación nativa...</span>
            </span>
          )}

          {phase === 'echoing' && (
            <span className="flex items-center gap-1.5 rounded-full bg-badge-success-bg px-2.5 py-1 text-tiny font-semibold text-success animate-bounce">
              <Timer className="size-3.5" />
              <span>🎤 Tu turno: ¡Repite en voz alta!</span>
            </span>
          )}

          {phase === 'idle' && activeSentenceIdx !== null && (
            <span className="text-tiny text-fg-muted font-mono">
              Oración {activeSentenceIdx + 1} de {totalSentences}
            </span>
          )}
        </div>
      </div>

      {/* Connected Speech Tips for Active Sentence */}
      {currentSegment?.connectedSpeechNotes && currentSegment.connectedSpeechNotes.length > 0 && (
        <div className="rounded-md border border-primary/20 bg-primary-soft/40 p-2.5 text-tiny text-fg">
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

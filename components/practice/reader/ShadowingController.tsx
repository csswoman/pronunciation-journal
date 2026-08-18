'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, Undo2, Volume2, Timer } from '@/components/icons';
import Button from '@/components/ui/Button';
import {
  splitIntoSentences,
  estimateSentenceSpeechDurationMs,
  type SentenceSegment,
  type ShadowingSettings,
  DEFAULT_SHADOWING_SETTINGS,
} from '@/lib/speech/shadowing';

interface ShadowingControllerProps {
  passageText: string;
  online: boolean;
  onActiveSentenceChange?: (index: number | null) => void;
}

type PlaybackPhase = 'idle' | 'listening' | 'echoing';

export function ShadowingController({
  passageText,
  online,
  onActiveSentenceChange,
}: ShadowingControllerProps) {
  const sentences = useRef<SentenceSegment[]>(splitIntoSentences(passageText)).current;

  const [activeSentenceIdx, setActiveSentenceIdx] = useState<number | null>(null);
  const [phase, setPhase] = useState<PlaybackPhase>('idle');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShadowingMode, setIsShadowingMode] = useState(true);
  const [settings, setSettings] = useState<ShadowingSettings>(DEFAULT_SHADOWING_SETTINGS);

  const echoTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    onActiveSentenceChange?.(activeSentenceIdx);
  }, [activeSentenceIdx, onActiveSentenceChange]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (echoTimerRef.current) clearTimeout(echoTimerRef.current);
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function stopAll() {
    setIsPlaying(false);
    setPhase('idle');
    if (echoTimerRef.current) clearTimeout(echoTimerRef.current);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  function playSentence(index: number) {
    if (index >= sentences.length) {
      stopAll();
      setActiveSentenceIdx(null);
      return;
    }

    const currentSentence = sentences[index];
    if (!currentSentence) return;

    setActiveSentenceIdx(index);
    setPhase('listening');
    setIsPlaying(true);

    if (
      typeof window === 'undefined' ||
      !window.speechSynthesis ||
      typeof SpeechSynthesisUtterance === 'undefined'
    ) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentSentence.text);
    utterance.lang = 'en-US';
    utterance.rate = settings.playbackRate;

    utterance.onend = () => {
      if (!isShadowingMode) {
        // En modo continuo, pasa directo a la siguiente
        playSentence(index + 1);
        return;
      }

      // En modo Shadowing: Fase de Eco (pausa para que el usuario repita)
      setPhase('echoing');
      const echoDurationMs =
        estimateSentenceSpeechDurationMs(currentSentence.wordCount, settings.playbackRate) *
        settings.pauseMultiplier;

      echoTimerRef.current = setTimeout(() => {
        if (settings.autoAdvance) {
          playSentence(index + 1);
        } else {
          setPhase('idle');
          setIsPlaying(false);
        }
      }, echoDurationMs);
    };

    utterance.onerror = () => {
      stopAll();
    };

    window.speechSynthesis.speak(utterance);
  }

  function togglePlay() {
    if (isPlaying) {
      stopAll();
    } else {
      const startIdx = activeSentenceIdx ?? 0;
      playSentence(startIdx);
    }
  }

  function handleRepeat() {
    if (activeSentenceIdx !== null) {
      if (echoTimerRef.current) clearTimeout(echoTimerRef.current);
      playSentence(activeSentenceIdx);
    } else {
      playSentence(0);
    }
  }

  function handleNext() {
    if (echoTimerRef.current) clearTimeout(echoTimerRef.current);
    const nextIdx = (activeSentenceIdx ?? -1) + 1;
    playSentence(nextIdx);
  }

  const currentSegment = activeSentenceIdx !== null ? sentences[activeSentenceIdx] : null;

  return (
    <div className="flex flex-col gap-3 rounded-card-interactive border border-border-default bg-surface-raised p-4 shadow-sm">
      {/* Header with Mode Toggle & Speed Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-default/60 pb-3">
        <div className="flex items-center gap-2">
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={isShadowingMode}
              onChange={(e) => {
                setIsShadowingMode(e.target.checked);
                if (isPlaying) stopAll();
              }}
              className="peer sr-only"
            />
            <div className="peer h-5 w-9 rounded-full bg-surface-sunken after:absolute after:top-0.5 after:left-0.5 after:h-4 after:w-4 after:rounded-full after:bg-fg-muted after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:bg-white peer-focus:outline-none" />
          </label>
          <span className="text-body-sm font-semibold text-fg">
            {isShadowingMode ? 'Modo Shadowing (Eco con pausas)' : 'Lectura continua'}
          </span>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-tiny text-fg-muted">Velocidad:</span>
          {[0.75, 1.0, 1.25].map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => {
                setSettings((s) => ({ ...s, playbackRate: rate }));
                if (isPlaying && activeSentenceIdx !== null) {
                  playSentence(activeSentenceIdx);
                }
              }}
              className={`rounded px-2 py-0.5 font-mono text-tiny font-medium transition-colors focus-ring ${
                settings.playbackRate === rate
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
            onClick={togglePlay}
            disabled={!online || sentences.length === 0}
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
                <span>{activeSentenceIdx !== null ? 'Reanudar' : 'Iniciar Shadowing'}</span>
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleRepeat}
            disabled={!online || activeSentenceIdx === null}
            title="Repetir oración actual"
            aria-label="Repetir oración actual"
          >
            <Undo2 className="size-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleNext}
            disabled={!online || (activeSentenceIdx !== null && activeSentenceIdx >= sentences.length - 1)}
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
              Oración {activeSentenceIdx + 1} de {sentences.length}
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

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { INTONATION_PATTERNS } from "@/lib/speech/intonation-patterns";
import {
  extractPitchTrack,
  evaluateIntonationContour,
  type PitchPoint,
  type IntonationAssessment,
} from "@/lib/speech/pitch-detector";
import { IntonationGraph } from "./IntonationGraph";
import { speakText, cancelSpeech } from "@/lib/speech/synthesis";
import Button from "@/components/ui/Button";
import { Mic, Volume2, ArrowRight } from "@/components/icons";
import { playUiCue } from "@/lib/ui-sounds/cues";
import { cn } from "@/lib/cn";

export function IntonationTrainer() {
  const [selectedPatternIndex, setSelectedPatternIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [userPitchPoints, setUserPitchPoints] = useState<PitchPoint[]>([]);
  const [assessment, setAssessment] = useState<IntonationAssessment | null>(null);
  const [micError, setMicError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentSentence = INTONATION_PATTERNS[selectedPatternIndex] ?? INTONATION_PATTERNS[0];

  useEffect(() => {
    // Reset state on sentence change
    setUserPitchPoints([]);
    setAssessment(null);
    setMicError(null);
    cancelSpeech();
    setIsPlayingAudio(false);
  }, [selectedPatternIndex]);

  const handlePlayReference = useCallback(() => {
    cancelSpeech();
    setIsPlayingAudio(true);
    speakText(currentSentence.text, {
      onEnd: () => setIsPlayingAudio(false),
      onError: () => setIsPlayingAudio(false),
    });
  }, [currentSentence.text]);

  const startRecording = async () => {
    try {
      setMicError(null);
      setUserPitchPoints([]);
      setAssessment(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });

        if (audioBlob.size < 1000) {
          setMicError("No se detectó audio suficiente. Intenta hablar con más volumen.");
          return;
        }

        try {
          const arrayBuffer = await audioBlob.arrayBuffer();
          const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

          // Extract pitch track from user audio buffer
          const points = extractPitchTrack(audioBuffer);
          setUserPitchPoints(points);

          // Evaluate contour match
          const result = evaluateIntonationContour(points, currentSentence.pattern);
          setAssessment(result);

          if (result.matched) {
            playUiCue("correct");
          } else {
            playUiCue("soft");
          }
        } catch {
          setMicError("No se pudo procesar el audio del micrófono.");
        }
      };

      mediaRecorder.start(50);
      setIsRecording(true);
      playUiCue("tap");
    } catch {
      setMicError("No se pudo acceder al micrófono. Verifica los permisos de tu navegador.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto py-2">
      {/* Pattern Selector Pills */}
      <div className="flex flex-wrap gap-2">
        {INTONATION_PATTERNS.map((item, idx) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelectedPatternIndex(idx)}
            className={cn(
              "rounded-full px-3.5 py-1.5 font-label text-xs transition-colors",
              selectedPatternIndex === idx
                ? "bg-primary text-on-primary font-semibold shadow-sm"
                : "bg-surface-raised border border-border-default text-fg-muted hover:text-fg hover:bg-surface-sunken",
            )}
          >
            {item.patternNameEs}
          </button>
        ))}
      </div>

      {/* Main Sentence Card */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border-default bg-surface-raised p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="font-caption uppercase tracking-wider text-xs font-semibold text-primary">
              {currentSentence.patternNameEs}
            </span>
            <h2 className="text-h2 font-bold text-fg mt-1 text-pretty">
              &ldquo;{currentSentence.text}&rdquo;
            </h2>
            <p className="text-body-sm text-fg-muted mt-1 text-pretty">
              {currentSentence.descriptionEs}
            </p>
          </div>

          <button
            type="button"
            onClick={handlePlayReference}
            disabled={isPlayingAudio}
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border-default bg-surface-base text-primary transition-transform hover:scale-105 active:scale-95",
              isPlayingAudio && "animate-pulse border-primary",
            )}
            title="Escuchar entonación de referencia"
            aria-label="Escuchar entonación de referencia"
          >
            <Volume2 size={22} />
          </button>
        </div>

        {/* Intonation Visualizer Canvas */}
        <IntonationGraph
          targetCurve={currentSentence.targetCurve}
          userPitchPoints={userPitchPoints}
          isRecording={isRecording}
        />

        {/* Feedback Section */}
        {assessment && (
          <div
            className={cn(
              "flex flex-col gap-2 rounded-xl border p-4 transition-all duration-200",
              assessment.matched
                ? "border-success/40 bg-success-soft"
                : "border-warning/40 bg-warning-soft",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={cn(
                  "font-label text-sm font-bold",
                  assessment.matched ? "text-success" : "text-warning",
                )}
              >
                {assessment.matched ? "✓ ¡Entonación lograda!" : "⚠ Revisa la curva"}
              </span>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-surface-raised text-fg">
                Puntaje: {assessment.scorePct}%
              </span>
            </div>
            <p className="text-body-sm text-fg text-pretty">{assessment.feedbackEs}</p>
          </div>
        )}

        {micError && (
          <div className="rounded-xl border border-error/40 bg-error-soft p-3 text-body-sm text-error" role="alert">
            {micError}
          </div>
        )}

        {/* Recording Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-border-subtle">
          <Button
            type="button"
            variant={isRecording ? "error" : "primary"}
            size="lg"
            onClick={isRecording ? stopRecording : startRecording}
            className="w-full sm:w-auto min-w-[200px]"
          >
            <Mic size={18} className={isRecording ? "animate-pulse" : ""} />
            {isRecording ? "Detener grabación" : "Grabar mi entonación"}
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => {
              setSelectedPatternIndex((prev) => (prev + 1) % INTONATION_PATTERNS.length);
            }}
            className="w-full sm:w-auto"
          >
            Siguiente oración
            <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}

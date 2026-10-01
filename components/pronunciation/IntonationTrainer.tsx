"use client";

// Planned structure:
// <IntonationTrainer>
//   <IntonationPatternPills />
//   <IntonationSentenceCard>
//     <IntonationGraph />
//     <IntonationAssessmentCard />
//     <RecordingControls />
//   </IntonationSentenceCard>
// </IntonationTrainer>

import { useCallback, useEffect, useRef, useState } from "react";
import { INTONATION_PATTERNS } from "@/lib/speech/intonation-patterns";
import {
  extractPitchTrack,
  evaluateIntonationContour,
  type PitchPoint,
  type IntonationAssessment,
} from "@/lib/speech/pitch-detector";
import { IntonationGraph } from "./IntonationGraph";
import {
  IntonationPatternPills,
  IntonationAssessmentCard,
  IntonationSentenceHeader,
} from "./IntonationParts";
import { speakText, cancelSpeech } from "@/lib/speech/synthesis";
import { recordIntonationAttempt } from "@/lib/sounds/queries";
import { useAuthOptional } from "@/components/auth/AuthProvider";
import { Mic, ArrowRight } from "@/components/icons";
import { playUiCue } from "@/lib/ui-sounds/cues";
import { hasAudibleAudio, NO_AUDIO_CAPTURED_MESSAGE } from "@/lib/speech/audio-thresholds";
import { ACOUSTIC_CAPTURE } from "@/lib/speech/capture-profiles";
import { cn } from "@/lib/cn";

import PastelCard from "@/components/layout/PastelCard";

export function IntonationTrainer() {
  const auth = useAuthOptional();
  const user = auth?.user ?? null;
  const [selectedPatternIndex, setSelectedPatternIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [userPitchPoints, setUserPitchPoints] = useState<PitchPoint[]>([]);
  const [assessment, setAssessment] = useState<IntonationAssessment | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordStartTimeRef = useRef<number>(0);
  const currentSentence = INTONATION_PATTERNS[selectedPatternIndex] ?? INTONATION_PATTERNS[0];

  useEffect(() => {
    setUserPitchPoints([]);
    setAssessment(null);
    setIsSaved(false);
    setMicError(null);
    cancelSpeech();
    setIsPlayingAudio(false);
  }, [selectedPatternIndex]);

  // Salir del ejercicio mientras se graba no debe dejar el micrófono abierto.
  useEffect(() => {
    return () => {
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state === "recording") {
        try {
          recorder.stop();
        } catch {
          // El recorder puede estar ya inactivo.
        }
      }
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
      cancelSpeech();
    };
  }, []);

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
      setIsSaved(false);

      const stream = await navigator.mediaDevices.getUserMedia(ACOUSTIC_CAPTURE);

      audioChunksRef.current = [];
      recordStartTimeRef.current = Date.now();
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      mediaStreamRef.current = stream;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });

        if (!hasAudibleAudio(audioBlob)) {
          setMicError(NO_AUDIO_CAPTURED_MESSAGE);
          return;
        }

        try {
          const arrayBuffer = await audioBlob.arrayBuffer();
          const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

          const points = extractPitchTrack(audioBuffer);
          setUserPitchPoints(points);

          const result = evaluateIntonationContour(points, currentSentence.pattern);
          setAssessment(result);

          if (result.matched) {
            playUiCue("correct");
          } else {
            playUiCue("soft");
          }

          if (user?.id) {
            const timeMs = Math.max(800, Date.now() - recordStartTimeRef.current);
            void recordIntonationAttempt(user.id, {
              sentenceId: currentSentence.id,
              pattern: currentSentence.pattern,
              text: currentSentence.text,
              score: result.scorePct,
              matched: result.matched,
              timeMs,
            }).then(() => setIsSaved(true)).catch((err) => console.warn('[IntonationTrainer] record error', err));
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
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,20rem)] gap-4 items-start w-full py-0">
      <PastelCard
        id="intonation-trainer-content"
        tone="sky"
        className="flex flex-col gap-3.5 rounded-3xl p-4 sm:p-6 w-full min-w-0 order-2 lg:order-1 shadow-xs border-0"
      >
        <IntonationSentenceHeader
          sentence={currentSentence}
          onPlay={handlePlayReference}
          isPlaying={isPlayingAudio}
          currentIndex={selectedPatternIndex + 1}
          totalCount={INTONATION_PATTERNS.length}
        />

        <IntonationGraph
          targetCurve={currentSentence.targetCurve}
          userPitchPoints={userPitchPoints}
          isRecording={isRecording}
        />

        {assessment && (
          <IntonationAssessmentCard assessment={assessment} isSaved={isSaved} />
        )}

        {micError && (
          <div className="rounded-xl border border-error/40 bg-error-soft p-3 ts-caption text-error" role="alert">
            {micError}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 mt-0.5">
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className={cn(
                "rounded-full px-5.5 py-3 font-bold text-sm sm:text-base inline-flex items-center gap-2.5 cursor-pointer shadow-xs whitespace-nowrap active:scale-95 transition-all",
                isRecording
                  ? "bg-error text-white animate-pulse"
                  : "bg-primary text-on-primary hover:bg-primary/90",
              )}
            >
              <Mic size={20} />
              <span>{isRecording ? "Detener grabación" : "Grabar mi entonación"}</span>
            </button>

            {userPitchPoints.length > 0 && !isRecording && (
              <button
                type="button"
                onClick={handlePlayReference}
                className="rounded-full px-5 py-3 font-bold text-sm sm:text-base inline-flex items-center gap-2 cursor-pointer bg-surface border border-border-default text-fg hover:bg-surface-sunken transition-all"
              >
                <span>Escuchar mi grabación</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedPatternIndex((prev) => (prev + 1) % INTONATION_PATTERNS.length);
            }}
            className="rounded-full px-6 py-3 font-bold text-sm sm:text-base inline-flex items-center gap-2.5 cursor-pointer shadow-xs active:scale-95 transition-all bg-ink text-paper hover:bg-ink-secondary ml-auto"
          >
            <span>Siguiente oración</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </PastelCard>

      <div className="order-1 lg:order-2 w-full">
        <IntonationPatternPills
          patterns={INTONATION_PATTERNS}
          selectedIndex={selectedPatternIndex}
          onSelect={setSelectedPatternIndex}
        />
      </div>
    </div>
  );
}

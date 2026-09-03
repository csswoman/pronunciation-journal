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
import Button from "@/components/ui/Button";
import { Mic, ArrowRight } from "@/components/icons";
import { playUiCue } from "@/lib/ui-sounds/cues";

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

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      audioChunksRef.current = [];
      recordStartTimeRef.current = Date.now();
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
    <div className="flex flex-col gap-6 max-w-4xl mx-auto py-2">
      <IntonationPatternPills
        patterns={INTONATION_PATTERNS}
        selectedIndex={selectedPatternIndex}
        onSelect={setSelectedPatternIndex}
      />

      <div className="flex flex-col gap-4 rounded-2xl border border-border-default bg-surface-raised p-6 shadow-sm">
        <IntonationSentenceHeader
          sentence={currentSentence}
          onPlay={handlePlayReference}
          isPlaying={isPlayingAudio}
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
          <div className="rounded-xl border border-error/40 bg-error-soft p-3 text-body-sm text-error" role="alert">
            {micError}
          </div>
        )}

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

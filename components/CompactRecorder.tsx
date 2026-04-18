"use client";

import { useRecorder } from "@/hooks/useRecorder";
import { useEffect, useRef } from "react";
import Button from "@/components/ui/Button";

interface CompactRecorderProps {
  onRecordingComplete: (audioUrl: string) => void;
  existingAudioUrl?: string;
}

export default function CompactRecorder({ onRecordingComplete, existingAudioUrl }: CompactRecorderProps) {
  const { 
    startRecording, 
    stopRecording, 
    audioUrl, 
    isRecording,
  } = useRecorder();

  const previousAudioUrlRef = useRef<string | null>(null);
  const callbackRef = useRef(onRecordingComplete);

  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = onRecordingComplete;
  }, [onRecordingComplete]);

  useEffect(() => {
    previousAudioUrlRef.current = existingAudioUrl ?? null;
  }, [existingAudioUrl]);

  useEffect(() => {
    // Only call onRecordingComplete when audioUrl changes to a new value
    if (audioUrl && audioUrl !== previousAudioUrlRef.current) {
      previousAudioUrlRef.current = audioUrl;
      callbackRef.current(audioUrl);
    }
  }, [audioUrl]);

  return (
    <div className="relative group">
      {!isRecording ? (
        <Button
          onClick={startRecording}
          variant="danger"
          size="icon"
          title="Record Your Pronunciation"
          aria-label="Record your pronunciation"
          className="bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 text-red-600 dark:text-red-400"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                clipRule="evenodd"
              />
            </svg>
          }
        >
        </Button>
      ) : (
        <Button
          onClick={stopRecording}
          variant="danger"
          size="icon"
          className="animate-pulse"
          title="Stop Recording"
          aria-label="Stop recording"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-white"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                clipRule="evenodd"
              />
            </svg>
          }
        >
        </Button>
      )}
      
      {/* Tooltip */}
      {!isRecording && (
        <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-10 px-3 py-1 bg-gray-800 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          Record pronunciation
        </span>
      )}
    </div>
  );
}


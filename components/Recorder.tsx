"use client";

import { useRecorder } from "@/hooks/useRecorder";
import { useEffect, useRef } from "react";

interface RecorderProps {
  onRecordingComplete: (audioUrl: string) => void;
  existingAudioUrl?: string;
}

export default function Recorder({ onRecordingComplete, existingAudioUrl }: RecorderProps) {
  const { 
    startRecording, 
    stopRecording, 
    audioUrl, 
    isRecording, 
    error,
    resetRecording 
  } = useRecorder();

  const previousAudioUrlRef = useRef<string | null>(null);
  const callbackRef = useRef(onRecordingComplete);

  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = onRecordingComplete;
  }, [onRecordingComplete]);

  useEffect(() => {
    // Only call onRecordingComplete when audioUrl changes from null to a value
    if (audioUrl && audioUrl !== previousAudioUrlRef.current) {
      previousAudioUrlRef.current = audioUrl;
      callbackRef.current(audioUrl);
    }
  }, [audioUrl]);

  const handlePlayAudio = (url: string) => {
    try {
      const audio = new Audio(url);
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Audio started playing successfully
          })
          .catch((error) => {
            // Error handling - ignore user-initiated errors
            if (error.name !== 'AbortError' && error.name !== 'NotAllowedError') {
              console.error("Error playing audio:", error);
            }
          });
      }
    } catch (error) {
      console.error("Error creating audio element:", error);
    }
  };

const handleReset = () => {
  resetRecording();
  callbackRef.current("");
};

  const currentAudioUrl = audioUrl || existingAudioUrl;

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Your Pronunciation
      </label>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        {!isRecording && !currentAudioUrl && (
          <button
            type="button"
            onClick={startRecording}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                clipRule="evenodd"
              />
            </svg>
            Start Recording
          </button>
        )}

        {isRecording && (
          <button
            type="button"
            onClick={stopRecording}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm font-medium animate-pulse"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                clipRule="evenodd"
              />
            </svg>
            Stop Recording
          </button>
        )}

        {currentAudioUrl && !isRecording && (
          <>
            <button
              type="button"
              onClick={() => handlePlayAudio(currentAudioUrl)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              </svg>
              Play
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                  clipRule="evenodd"
                />
              </svg>
              Re-record
            </button>
          </>
        )}
      </div>

      {currentAudioUrl && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-700 dark:text-green-400">
            ✓ Recording saved successfully
          </p>
        </div>
      )}
    </div>
  );
}


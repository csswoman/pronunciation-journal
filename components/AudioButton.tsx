"use client";

import Button from "@/components/ui/Button";
import { playAudio } from "@/lib/audio-utils";

interface AudioButtonProps {
  audioUrl: string;
  variant: "dictionary" | "user";
}

export default function AudioButton({ audioUrl, variant }: AudioButtonProps) {
  const isDictionary = variant === "dictionary";

  return (
    <Button
      onClick={() => playAudio(audioUrl, { showAlerts: true })}
      className="p-3 rounded-full transition-colors"
      style={{
        backgroundColor: "var(--btn-regular-bg)",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--btn-regular-bg-hover)")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--btn-regular-bg)")}
      title={isDictionary ? "Dictionary Pronunciation" : "Your Pronunciation"}
      aria-label={isDictionary ? "Play dictionary pronunciation" : "Play your pronunciation"}
    >
      {isDictionary ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          style={{ color: "var(--primary)" }}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-green-600 dark:text-green-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
          <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3v5z" />
          <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3v5z" />
        </svg>
      )}
    </Button>
  );
}

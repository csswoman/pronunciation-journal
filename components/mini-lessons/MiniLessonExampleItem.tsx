"use client";

import React, { useState } from "react";
import type { LessonExample } from "@/lib/content/schemas";

// Planned structure:
// <MiniLessonExampleItem>
//   <ExampleDetails>
//     <WordText />
//     <IpaText />
//     <NoteText />
//   </ExampleDetails>
//   <PlayButton />
// </MiniLessonExampleItem>

interface MiniLessonExampleItemProps {
  example: LessonExample;
}

export default function MiniLessonExampleItem({ example }: MiniLessonExampleItemProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayAudio = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(example.english);
    utterance.lang = "en-US";
    utterance.rate = 0.9;

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="mini-lessons__example-item">
      <div className="mini-lessons__example-info">
        <h3 className="mini-lessons__example-word">{example.english}</h3>
        {example.ipa && (
          <p className="mini-lessons__example-ipa" lang="en-fonipa">
            <span className="mini-lessons__ipa-slash" aria-hidden="true">
              /
            </span>
            {example.ipa.replace(/^\/|\/$/g, "")}
            <span className="mini-lessons__ipa-slash" aria-hidden="true">
              /
            </span>
          </p>
        )}
        {(example.translation || example.note) && (
          <p className="mini-lessons__example-note">
            {example.translation || example.note}
          </p>
        )}
      </div>
      <button
        type="button"
        className={`mini-lessons__play-btn ${isPlaying ? "mini-lessons__play-btn--active" : ""}`}
        onClick={handlePlayAudio}
        aria-label={`Escuchar pronunciación de ${example.english}`}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M8 5v14l11-7z" />
        </svg>
      </button>
    </div>
  );
}

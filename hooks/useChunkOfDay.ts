"use client";

import { useState, useEffect, useCallback } from "react";
import type { ChunkItem } from "@/lib/chunk-of-day/types";
import { getChunkOfDay, getRandomChunk } from "@/lib/chunk-of-day/getChunkOfDay";

const SESSION_CHUNK_KEY = "chunk_of_day_session";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useChunkOfDay() {
  const [chunk, setChunk] = useState<ChunkItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isShuffled, setIsShuffled] = useState<boolean>(false);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_CHUNK_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.date === todayKey() && parsed.chunk) {
          setChunk(parsed.chunk);
          setIsShuffled(Boolean(parsed.isShuffled));
          setLoading(false);
          return;
        }
      }
    } catch {
      // Ignore cache read failures
    }

    const initial = getChunkOfDay(todayKey());
    setChunk(initial);
    setIsShuffled(false);
    setLoading(false);
  }, []);

  const shuffle = useCallback(() => {
    setChunk((current) => {
      const next = getRandomChunk(current?.id);
      try {
        sessionStorage.setItem(
          SESSION_CHUNK_KEY,
          JSON.stringify({
            date: todayKey(),
            chunk: next,
            isShuffled: true,
          })
        );
      } catch {
        // Ignore cache write errors
      }
      setIsShuffled(true);
      return next;
    });
  }, []);

  const resetToDaily = useCallback(() => {
    const daily = getChunkOfDay(todayKey());
    setChunk(daily);
    setIsShuffled(false);
    try {
      sessionStorage.setItem(
        SESSION_CHUNK_KEY,
        JSON.stringify({
          date: todayKey(),
          chunk: daily,
          isShuffled: false,
        })
      );
    } catch {
      // Ignore cache write errors
    }
  }, []);

  return {
    chunk,
    loading,
    isShuffled,
    shuffle,
    resetToDaily,
  };
}

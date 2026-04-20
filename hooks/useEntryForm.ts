"use client";

import { useEffect, useRef, useState } from "react";
import { Entry, Difficulty, Meaning } from "@/lib/types";
import {
  fetchPronunciation,
  getWordSuggestions,
  saveEntry,
  WordSuggestion,
} from "@/lib/entry-service";

interface UseEntryFormProps {
  onSave?: (entry: Entry) => void;
}

export function useEntryForm({ onSave }: UseEntryFormProps = {}) {
  const [word, setWord] = useState("");
  const [ipa, setIpa] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [tags, setTags] = useState("");
  const [meanings, setMeanings] = useState<Meaning[] | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [suggestions, setSuggestions] = useState<WordSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wordInputRef = useRef<HTMLInputElement>(null);
  const [apiSetFields, setApiSetFields] = useState<{
    ipa: boolean;
    audioUrl: boolean;
    meanings: boolean;
  }>({ ipa: false, audioUrl: false, meanings: false });

  const handleFetchPronunciation = async (wordToFetch?: string) => {
    const wordToUse = wordToFetch || word;
    if (!wordToUse.trim()) {
      setError("Please enter a word first");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const data = await fetchPronunciation(wordToUse.trim());
      const newApiSetFields = { ...apiSetFields };

      if (data.ipa) {
        setIpa(data.ipa);
        newApiSetFields.ipa = true;
      }
      if (data.audioUrl) {
        setAudioUrl(data.audioUrl);
        newApiSetFields.audioUrl = true;
      }
      if (data.meanings) {
        setMeanings(data.meanings);
        newApiSetFields.meanings = true;
      }
      if (data.sourceUrl) {
        setSourceUrl(data.sourceUrl);
      }

      setApiSetFields(newApiSetFields);

      if (data.ipa || data.audioUrl || data.meanings) {
        setSuccess("Pronunciation data fetched successfully!");
      } else {
        setError("No pronunciation data found for this word");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch pronunciation";
      setError(errorMessage);

      if (apiSetFields.ipa) {
        setIpa("");
      }
      if (apiSetFields.audioUrl) {
        setAudioUrl("");
      }
      if (apiSetFields.meanings) {
        setMeanings(null);
      }
      setSourceUrl(null);
      setApiSetFields({ ipa: false, audioUrl: false, meanings: false });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    async function fetchSuggestions() {
      if (word.length >= 2) {
        const words = await getWordSuggestions(word);
        setSuggestions(words);
        setShowSuggestions(words.length > 0);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }

    const timeoutId = setTimeout(() => {
      fetchSuggestions();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [word]);

  const handleSuggestionClick = (suggestion: WordSuggestion) => {
    setWord(suggestion.word);
    setShowSuggestions(false);
    if (suggestion.word.trim()) {
      handleFetchPronunciation(suggestion.word);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!word.trim()) {
      setError("Word is required");
      return;
    }

    const newEntry: Entry = {
      id: crypto.randomUUID(),
      word: word.trim(),
      ipa: ipa.trim() || undefined,
      audioUrl: audioUrl.trim() || undefined,
      notes: notes.trim() || undefined,
      difficulty,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0),
      meanings: meanings || undefined,
      createdAt: new Date().toISOString(),
    };

    try {
      await saveEntry(newEntry);

      if (onSave) {
        onSave(newEntry);
      }

      setWord("");
      setIpa("");
      setAudioUrl("");
      setNotes("");
      setDifficulty("medium");
      setTags("");
      setMeanings(null);
      setSourceUrl(null);
      setApiSetFields({ ipa: false, audioUrl: false, meanings: false });
      setShowDetails(false);
      setSuccess("Entry saved successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save entry");
    }
  };

  return {
    word,
    setWord,
    ipa,
    setIpa,
    audioUrl,
    setAudioUrl,
    notes,
    setNotes,
    difficulty,
    setDifficulty,
    tags,
    setTags,
    meanings,
    sourceUrl,
    error,
    success,
    isLoading,
    showDetails,
    setShowDetails,
    suggestions,
    showSuggestions,
    setShowSuggestions,
    wordInputRef,
    apiSetFields,
    handleFetchPronunciation,
    handleSuggestionClick,
    handleSubmit,
  };
}

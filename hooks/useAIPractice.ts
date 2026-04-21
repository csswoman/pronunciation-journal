"use client";

import { useState, useEffect, useCallback } from "react";
import type { ExerciseResult } from "@/lib/ai-practice/types";
import type { StartRoleplayArgs } from "@/lib/ai-practice/tools/registry";
import { getUserLearningState } from "@/lib/ai-practice/load-state";
import type { UserLearningState } from "@/lib/ai-practice/learning-state";
import type { AISavedWord } from "@/lib/types";
import { useAuth } from "@/components/AuthProvider";
import { useStreamingChat } from "./useStreamingChat";
import { useSavedWords, type SaveWordData } from "./useSavedWords";

export type { SaveWordData };

interface UseAIPracticeReturn {
  messages: ReturnType<typeof useStreamingChat>["messages"];
  isStreaming: boolean;
  error: string | null;
  savedWords: AISavedWord[];
  wordToSave: { word: string; context: string } | null;
  activeRoleplay: StartRoleplayArgs["scenario"] | null;
  sendMessage: (text: string) => Promise<void>;
  answerToolCall: (callId: string, result: ExerciseResult) => void;
  openSaveWordModal: (word: string, context: string) => void;
  closeSaveWordModal: () => void;
  confirmSaveWord: (data: SaveWordData) => Promise<void>;
  deleteSavedWord: (id: number) => Promise<void>;
  loadSavedWords: () => Promise<void>;
  resetSession: () => void;
}

export function useAIPractice(): UseAIPracticeReturn {
  const { user } = useAuth();
  const [learningState, setLearningState] = useState<UserLearningState | null>(null);
  const [activeRoleplay, setActiveRoleplay] = useState<StartRoleplayArgs["scenario"] | null>(null);
  const [conversationId, setConversationId] = useState<number | null>(null);

  const words = useSavedWords(conversationId);

  const chat = useStreamingChat({
    learningState,
    setLearningState,
    onSaveWord: words.openSaveWordModal,
    onStartRoleplay: setActiveRoleplay,
  });

  useEffect(() => {
    words.loadSavedWords();
    if (user?.id) {
      getUserLearningState(user.id).then(setLearningState).catch(() => {});
    }
  }, [user?.id]);

  // Keep conversationId in sync after chat persists a new conversation.
  // useStreamingChat manages its own conversationId internally; we expose
  // resetSession here to coordinate both sub-hooks.
  const resetSession = useCallback(() => {
    chat.resetChat();
    setConversationId(null);
    setActiveRoleplay(null);
    words.setWordToSave(null);
  }, [chat, words]);

  return {
    messages: chat.messages,
    isStreaming: chat.isStreaming,
    error: chat.error,
    savedWords: words.savedWords,
    wordToSave: words.wordToSave,
    activeRoleplay,
    sendMessage: chat.sendMessage,
    answerToolCall: chat.answerToolCall,
    openSaveWordModal: words.openSaveWordModal,
    closeSaveWordModal: words.closeSaveWordModal,
    confirmSaveWord: words.confirmSaveWord,
    deleteSavedWord: words.deleteSavedWord,
    loadSavedWords: words.loadSavedWords,
    resetSession,
  };
}

"use client";

import { useState, useEffect, useCallback } from "react";
import type { ExerciseResult } from "@/lib/ai-practice/types";
import type { StartRoleplayArgs } from "@/lib/ai-practice/tools/registry";
import { getUserLearningState } from "@/lib/ai-practice/load-state";
import type { UserLearningState } from "@/lib/ai-practice/learning-state";
import type { AISavedWord, AIConversationMode } from "@/lib/types";
import { useAuth } from "@/components/auth/AuthProvider";
import { useStreamingChat } from "./useStreamingChat";
import { useSavedWords, type SaveWordData } from "./useSavedWords";
import { switchMode } from "@/lib/ai-practice/conversation-mode";

export type { SaveWordData };

interface UseAIPracticeReturn {
  messages: ReturnType<typeof useStreamingChat>["messages"];
  isStreaming: boolean;
  error: string | null;
  savedWords: AISavedWord[];
  wordToSave: { word: string; context: string } | null;
  activeRoleplay: StartRoleplayArgs["scenario"] | null;
  mode: AIConversationMode;
  conversationId: number | null;
  sendMessage: (text: string) => Promise<void>;
  answerToolCall: (callId: string, result: ExerciseResult) => void;
  openSaveWordModal: (word: string, context: string) => void;
  closeSaveWordModal: () => void;
  confirmSaveWord: (data: SaveWordData) => Promise<void>;
  deleteSavedWord: (id: number) => Promise<void>;
  loadSavedWords: () => Promise<void>;
  resetSession: () => void;
  changeMode: (next: AIConversationMode) => Promise<void>;
}

export function useAIPractice(): UseAIPracticeReturn {
  const { user } = useAuth();
  const [learningState, setLearningState] = useState<UserLearningState | null>(null);
  const [activeRoleplay, setActiveRoleplay] = useState<StartRoleplayArgs["scenario"] | null>(null);
  const [mode, setMode] = useState<AIConversationMode>("chat");
  const [conversationId, setConversationId] = useState<number | null>(null);

  const words = useSavedWords(conversationId);

  const chat = useStreamingChat({
    mode,
    conversationId,
    onConversationCreated: setConversationId,
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // On mount: resume last chat conversation (if any)
  useEffect(() => {
    switchMode("chat").then(({ conversationId: id }) => setConversationId(id)).catch(() => {});
  }, []);

  const changeMode = useCallback(async (next: AIConversationMode) => {
    chat.resetChat();
    setActiveRoleplay(null);
    words.setWordToSave(null);
    setMode(next);
    const { conversationId: id, conversation } = await switchMode(next);
    setConversationId(id);

    // Restore messages from the existing conversation (if any)
    if (conversation.messages.length > 0) {
      chat.loadMessages(conversation.messages as never);
    }

    // Track active roleplay scenario from mode string
    if (next.startsWith("roleplay:")) {
      setActiveRoleplay(next.slice("roleplay:".length) as StartRoleplayArgs["scenario"]);
    }
  }, [chat, words]);

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
    mode,
    conversationId,
    sendMessage: chat.sendMessage,
    answerToolCall: chat.answerToolCall,
    openSaveWordModal: words.openSaveWordModal,
    closeSaveWordModal: words.closeSaveWordModal,
    confirmSaveWord: words.confirmSaveWord,
    deleteSavedWord: words.deleteSavedWord,
    loadSavedWords: words.loadSavedWords,
    resetSession,
    changeMode,
  };
}

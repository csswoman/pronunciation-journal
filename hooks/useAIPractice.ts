"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ExerciseResult } from "@/lib/ai-practice/types";
import type { StartRoleplayArgs } from "@/lib/ai-practice/tools/registry";
import { getUserLearningState } from "@/lib/ai-practice/load-state";
import { hydrateFromRemote, persistLearningState } from "@/lib/ai-practice/queries";
import type { UserLearningState } from "@/lib/ai-practice/learning-state";
import type { AISavedWord, AIConversation, AIConversationMode } from "@/lib/types";
import { useAuth } from "@/components/auth/AuthProvider";
import { useStreamingChat } from "./useStreamingChat";
import { useSavedWords, type SaveWordData } from "./useSavedWords";
import { switchMode } from "@/lib/ai-practice/conversation-mode";
import { deleteConversation } from "@/lib/db/ai";

export type { SaveWordData };

interface UseAIPracticeReturn {
  messages: ReturnType<typeof useStreamingChat>["messages"];
  isStreaming: boolean;
  error: string | null;
  quotaExhausted: boolean;
  savedWords: AISavedWord[];
  wordToSave: { word: string; context: string } | null;
  activeRoleplay: StartRoleplayArgs["scenario"] | null;
  mode: AIConversationMode;
  conversationId: number | null;
  sendMessage: (text: string, options?: { hidden?: boolean }) => Promise<void>;
  answerToolCall: (callId: string, result: ExerciseResult) => void;
  openSaveWordModal: (word: string, context: string) => void;
  closeSaveWordModal: () => void;
  confirmSaveWord: (data: SaveWordData) => Promise<void>;
  deleteSavedWord: (id: number) => Promise<void>;
  loadSavedWords: () => Promise<void>;
  resetSession: () => void;
  changeMode: (next: AIConversationMode) => Promise<void>;
  loadConversation: (conv: AIConversation) => void;
  removeConversation: (id: number) => Promise<void>;
}

export function useAIPractice(): UseAIPracticeReturn {
  const { user } = useAuth();
  const [learningState, setLearningState] = useState<UserLearningState | null>(null);
  const persistTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    userId: user?.id ?? null,
  });

  useEffect(() => {
    if (!user?.id) return;

    const userId = user.id;
    let cancelled = false;

    void (async () => {
      await words.loadSavedWords();
      await hydrateFromRemote(userId).catch(() => {});
      if (cancelled) return;
      const state = await getUserLearningState(userId).catch(() => null);
      if (!cancelled && state) setLearningState(state);
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, words.loadSavedWords]);

  // Throttled persistence: sync learningState to Supabase 5s after the last update.
  useEffect(() => {
    if (!user?.id || !learningState) return;
    const userId = user.id;
    if (persistTimeoutRef.current) clearTimeout(persistTimeoutRef.current);
    persistTimeoutRef.current = setTimeout(() => {
      persistLearningState(userId, learningState).catch(() => {});
    }, 5000);
    return () => {
      if (persistTimeoutRef.current) clearTimeout(persistTimeoutRef.current);
    };
  }, [user?.id, learningState]);

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

  const loadConversation = useCallback((conv: AIConversation) => {
    chat.resetChat();
    words.setWordToSave(null);
    setMode(conv.mode ?? "chat");
    setConversationId(conv.id ?? null);
    if (conv.mode?.startsWith("roleplay:")) {
      setActiveRoleplay(conv.mode.slice("roleplay:".length) as StartRoleplayArgs["scenario"]);
    } else {
      setActiveRoleplay(null);
    }
    if (conv.messages.length > 0) {
      chat.loadMessages(conv.messages as never);
    }
  }, [chat, words]);

  const removeConversation = useCallback(async (id: number) => {
    await deleteConversation(id);
    if (conversationId === id) resetSession();
  }, [conversationId, resetSession]);

  return {
    messages: chat.messages,
    isStreaming: chat.isStreaming,
    error: chat.error,
    quotaExhausted: chat.quotaExhausted,
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
    loadConversation,
    removeConversation,
  };
}

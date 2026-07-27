"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ExerciseResult, VoiceMetadata } from "@/lib/ai-practice/types";
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
  activeMissionId: string | null;
  mode: AIConversationMode;
  conversationId: number | null;
  sendMessage: (text: string, options?: { hidden?: boolean; voice?: VoiceMetadata }) => Promise<void>;
  answerToolCall: (callId: string, result: ExerciseResult) => void;
  openSaveWordModal: (word: string, context: string) => void;
  closeSaveWordModal: () => void;
  confirmSaveWord: (data: SaveWordData) => Promise<void>;
  deleteSavedWord: (id: number) => Promise<void>;
  loadSavedWords: () => Promise<void>;
  resetSession: () => void;
  finalizeSession: () => void;
  changeMode: (next: AIConversationMode) => Promise<void>;
  loadConversation: (conv: AIConversation) => void;
  removeConversation: (id: number) => Promise<void>;
}

export function useAIPractice(): UseAIPracticeReturn {
  const { user } = useAuth();
  const [learningState, setLearningState] = useState<UserLearningState | null>(null);
  const persistTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeMissionId, setActiveMissionId] = useState<string | null>(null);
  const [mode, setMode] = useState<AIConversationMode>("chat");
  const [conversationId, setConversationId] = useState<number | null>(null);

  const words = useSavedWords(user?.id ?? null, conversationId);

  const chat = useStreamingChat({
    mode,
    conversationId,
    onConversationCreated: setConversationId,
    learningState,
    setLearningState,
    onSaveWord: words.openSaveWordModal,
    onStartMission: setActiveMissionId,
    // TODO(missions): Wire this to MissionRunner's missionReducer dispatch in the UI phase.
    // useAIPractice deliberately owns only activeMissionId, never mission progress.
    onMissionIntentObserved: () => {},
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
  // Flushed early (instead of just cancelled) on unmount, dependency change, and
  // `pagehide` so an in-flight snapshot (weak topics, spoken targets, etc.) is never
  // silently dropped when the user navigates away within the debounce window.
  useEffect(() => {
    if (!user?.id || !learningState) return;
    const userId = user.id;
    let flushed = false;

    const flush = () => {
      if (flushed) return;
      flushed = true;
      if (persistTimeoutRef.current) {
        clearTimeout(persistTimeoutRef.current);
        persistTimeoutRef.current = null;
      }
      persistLearningState(userId, learningState).catch(() => {});
    };

    if (persistTimeoutRef.current) clearTimeout(persistTimeoutRef.current);
    persistTimeoutRef.current = setTimeout(() => {
      persistTimeoutRef.current = null;
      flush();
    }, 5000);

    window.addEventListener("pagehide", flush);

    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [user?.id, learningState]);

  // On mount: resume last chat conversation (if any)
  useEffect(() => {
    if (!user?.id) { setConversationId(null); return; }
    switchMode(user.id, "chat").then(({ conversationId: id }) => setConversationId(id)).catch(() => {});
  }, [user?.id]);

  const changeMode = useCallback(async (next: AIConversationMode) => {
    if (!user?.id) return;
    chat.resetChat();
    setActiveMissionId(null);
    words.setWordToSave(null);
    setMode(next);
    const { conversationId: id, conversation } = await switchMode(user.id, next);
    setConversationId(id);

    // Restore messages from the existing conversation (if any)
    if (conversation.messages.length > 0) {
      chat.loadMessages(conversation.messages as never);
    }

    // Track the active mission id from the mode string.
    if (next.startsWith("mission:")) {
      setActiveMissionId(next.slice("mission:".length));
    }
  }, [chat, words, user?.id]);

  const resetSession = useCallback(() => {
    chat.resetChat();
    setConversationId(null);
    setActiveMissionId(null);
    words.setWordToSave(null);
  }, [chat, words]);

  const loadConversation = useCallback((conv: AIConversation) => {
    chat.resetChat();
    words.setWordToSave(null);
    setMode(conv.mode ?? "chat");
    setConversationId(conv.id ?? null);
    if (conv.mode?.startsWith("mission:")) {
      setActiveMissionId(conv.mode.slice("mission:".length));
    } else {
      setActiveMissionId(null);
    }
    if (conv.messages.length > 0) {
      chat.loadMessages(conv.messages as never);
    }
  }, [chat, words]);

  const removeConversation = useCallback(async (id: number) => {
    if (!user?.id) return;
    await deleteConversation(user.id, id);
    if (conversationId === id) resetSession();
  }, [conversationId, resetSession, user?.id]);

  return {
    messages: chat.messages,
    isStreaming: chat.isStreaming,
    error: chat.error,
    quotaExhausted: chat.quotaExhausted,
    savedWords: words.savedWords,
    wordToSave: words.wordToSave,
    activeMissionId,
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
    finalizeSession: chat.finalizeSession,
    changeMode,
    loadConversation,
    removeConversation,
  };
}

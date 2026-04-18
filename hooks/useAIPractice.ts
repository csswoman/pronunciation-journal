"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type {
  AIConversation,
  AIMessage,
  AISavedWord,
  AITemplateId,
  Difficulty,
  TemplateVars,
} from "@/lib/types";
import {
  saveConversation,
  updateConversation,
  saveAIWord,
  getAIWords,
  deleteAIWord,
} from "@/lib/ai-db";
import {
  SYSTEM_PROMPTS,
  buildPracticeQuestionsPrompt,
  buildSentenceCorrectionPrompt,
  buildPersonalizedPracticePrompt,
  buildFreeConversationPrompt,
  accuracyToLevel,
} from "@/lib/ai-prompts";
import { getUserStats, getFavorites, getNeedsPracticeWords } from "@/lib/db";
import { parseSession, extractChatText } from "@/lib/parse-session";
import type { LearningSession } from "@/lib/types";

export type Phase = "select" | "configure" | "chat";

interface SaveWordData {
  word: string;
  meaning: string;
  difficulty: Difficulty;
  context: string;
}

interface UseAIPracticeState {
  phase: Phase;
  selectedTemplate: AITemplateId | "custom" | null;
  systemPrompt: string;
  messages: AIMessage[];
  isStreaming: boolean;
  error: string | null;
  conversationId: number | null;
  wordToSave: { word: string; context: string } | null;
  savedWords: AISavedWord[];
  /** Latest parsed LearningSession from the most recent AI response */
  activeSession: LearningSession | null;
}

interface UseAIPracticeReturn extends UseAIPracticeState {
  selectTemplate: (id: AITemplateId) => void;
  submitTemplateVars: (vars: TemplateVars) => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  openSaveWordModal: (word: string, context: string) => void;
  closeSaveWordModal: () => void;
  confirmSaveWord: (data: SaveWordData) => Promise<void>;
  deleteSavedWord: (id: number) => Promise<void>;
  resetToSelect: () => void;
  loadSavedWords: () => Promise<void>;
  clearSession: () => void;
}

export function useAIPractice(): UseAIPracticeReturn {
  const [phase, setPhase] = useState<Phase>("chat");
  const [selectedTemplate, setSelectedTemplate] = useState<AITemplateId | "custom" | null>(null);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [wordToSave, setWordToSave] = useState<{ word: string; context: string } | null>(null);
  const [savedWords, setSavedWords] = useState<AISavedWord[]>([]);
  const [activeSession, setActiveSession] = useState<LearningSession | null>(null);

  // Keep a ref to the latest messages for async callbacks
  const messagesRef = useRef<AIMessage[]>([]);
  messagesRef.current = messages;

  useEffect(() => {
    loadSavedWords();
  }, []);

  const loadSavedWords = useCallback(async () => {
    const words = await getAIWords();
    setSavedWords(words);
  }, []);

  const selectTemplate = useCallback((id: AITemplateId) => {
    setSelectedTemplate(id);
    setPhase("configure");
    setError(null);
  }, []);

  const resolveTemplateContext = async (
    vars: TemplateVars
  ): Promise<{ prompt: string; sysPrompt: string }> => {
    const stats = await getUserStats();
    const computedLevel = accuracyToLevel(stats.averageAccuracy);

    switch (vars.templateId) {
      case "practice-questions":
        return {
          sysPrompt: SYSTEM_PROMPTS["practice-questions"],
          prompt: buildPracticeQuestionsPrompt(vars.topic, vars.userLevel || computedLevel),
        };

      case "sentence-correction":
        return {
          sysPrompt: SYSTEM_PROMPTS["sentence-correction"],
          prompt: buildSentenceCorrectionPrompt(vars.sentence),
        };

      case "personalized-practice": {
        const [practiceWords, favorites] = await Promise.all([
          getNeedsPracticeWords(),
          getFavorites(),
        ]);
        return {
          sysPrompt: SYSTEM_PROMPTS["personalized-practice"],
          prompt: buildPersonalizedPracticePrompt(practiceWords, favorites, computedLevel),
        };
      }

      case "free-conversation":
        return {
          sysPrompt: SYSTEM_PROMPTS["free-conversation"],
          prompt: buildFreeConversationPrompt(vars.topic),
        };

      default:
        return { sysPrompt: "", prompt: "" };
    }
  };

  const callGemini = async (
    msgs: AIMessage[],
    sysPrompt: string
  ): Promise<string> => {
    const res = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: msgs, systemPrompt: sysPrompt }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      if (res.status === 429) {
        throw new Error("Rate limit reached. Please wait a moment and try again.");
      }
      throw new Error(data.error || "Failed to get a response from the AI.");
    }

    const data = await res.json();
    return data.content as string;
  };

  const submitTemplateVars = useCallback(async (vars: TemplateVars) => {
    setError(null);
    setIsStreaming(true);

    try {
      const { prompt, sysPrompt } = await resolveTemplateContext(vars);
      setSystemPrompt(sysPrompt);

      const userMsg: AIMessage = {
        role: "user",
        content: prompt,
        timestamp: new Date().toISOString(),
      };

      const initialMessages = [userMsg];
      setMessages(initialMessages);
      setPhase("chat");

      const responseText = await callGemini(initialMessages, sysPrompt);

      // Extract structured session and strip JSON block from chat display
      const session = parseSession(responseText);
      const chatContent = session ? extractChatText(responseText) : responseText;
      if (session) setActiveSession(session);

      const modelMsg: AIMessage = {
        role: "model",
        content: chatContent,
        timestamp: new Date().toISOString(),
      };

      const updatedMessages = [...initialMessages, modelMsg];
      setMessages(updatedMessages);

      // Persist conversation
      const title = prompt.slice(0, 60);
      const now = new Date().toISOString();
      const conv: Omit<AIConversation, "id"> = {
        templateId: vars.templateId,
        title,
        messages: updatedMessages,
        createdAt: now,
        updatedAt: now,
      };
      const id = await saveConversation(conv);
      setConversationId(id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred.");
      setPhase("configure");
    } finally {
      setIsStreaming(false);
    }
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming) return;
      setError(null);

      const userMsg: AIMessage = {
        role: "user",
        content: text.trim(),
        timestamp: new Date().toISOString(),
      };

      const updatedMessages = [...messagesRef.current, userMsg];
      setMessages(updatedMessages);
      setIsStreaming(true);

      try {
        const responseText = await callGemini(updatedMessages, systemPrompt);

        const session = parseSession(responseText);
        const chatContent = session ? extractChatText(responseText) : responseText;
        if (session) setActiveSession(session);

        const modelMsg: AIMessage = {
          role: "model",
          content: chatContent,
          timestamp: new Date().toISOString(),
        };

        const finalMessages = [...updatedMessages, modelMsg];
        setMessages(finalMessages);

        // Persist
        const now = new Date().toISOString();
        if (conversationId) {
          await updateConversation(conversationId, {
            messages: finalMessages,
            updatedAt: now,
          });
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "An error occurred.");
        // Remove the user message we optimistically added
        setMessages(messagesRef.current.slice(0, -1));
      } finally {
        setIsStreaming(false);
      }
    },
    [isStreaming, systemPrompt, conversationId]
  );

  const openSaveWordModal = useCallback((word: string, context: string) => {
    setWordToSave({ word, context });
  }, []);

  const closeSaveWordModal = useCallback(() => {
    setWordToSave(null);
  }, []);

  const confirmSaveWord = useCallback(
    async (data: SaveWordData) => {
      const wordData: Omit<AISavedWord, "id"> = {
        word: data.word.toLowerCase().trim(),
        meaning: data.meaning,
        difficulty: data.difficulty,
        context: data.context,
        conversationId: conversationId ?? 0,
        savedAt: new Date().toISOString(),
      };
      const id = await saveAIWord(wordData);
      setSavedWords((prev) => [{ ...wordData, id }, ...prev]);
      setWordToSave(null);
    },
    [conversationId]
  );

  const deleteSavedWord = useCallback(async (id: number) => {
    await deleteAIWord(id);
    setSavedWords((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const clearSession = useCallback(() => {
    setActiveSession(null);
  }, []);

  const resetToSelect = useCallback(() => {
    setPhase("chat");
    setSelectedTemplate(null);
    setMessages([]);
    setSystemPrompt("");
    setConversationId(null);
    setError(null);
    setWordToSave(null);
    setActiveSession(null);
  }, []);

  return {
    phase,
    selectedTemplate,
    systemPrompt,
    messages,
    isStreaming,
    error,
    conversationId,
    wordToSave,
    savedWords,
    activeSession,
    selectTemplate,
    submitTemplateVars,
    sendMessage,
    openSaveWordModal,
    closeSaveWordModal,
    confirmSaveWord,
    deleteSavedWord,
    resetToSelect,
    loadSavedWords,
    clearSession,
  };
}

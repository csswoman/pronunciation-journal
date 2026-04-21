import type { ExerciseResult } from "./types";

export interface UserLearningState {
  userId: string;
  updatedAt: string;
  deviceId: string;
  syncedAt?: string;

  level: {
    cefrEstimate: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
    confidence: number;
  };

  vocabulary: {
    knownCount: number;
    strugglingWords: Array<{
      word: string;
      bestAccuracy: number;
      attempts: number;
      lastSeen: string;
    }>;
    savedWords: Array<{ word: string; ipa?: string }>;
  };

  grammar: {
    weakTopics: Array<{
      topic: string;
      errorRate: number;
      sampleCount: number;
      lastCoveredAt: string;
    }>;
  };

  pronunciation: {
    averageAccuracy: number;
    strugglingSounds: Array<{
      ipa: string;
      avgAccuracy: number;
      attempts: number;
    }>;
  };

  lastSessions: Array<{
    topic: string;
    endedAt: string;
    exercisesCompleted: number;
    correctRate: number;
  }>;
}

export function compactState(s: UserLearningState): string {
  const now = Date.now();
  const topGrammar = s.grammar.weakTopics
    .map(t => ({
      ...t,
      priority: t.errorRate * (now - new Date(t.lastCoveredAt).getTime()),
    }))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 2)
    .map(t => `${t.topic}(${(t.errorRate * 100) | 0}%)`);

  const topSounds = s.pronunciation.strugglingSounds.slice(0, 2).map(p => p.ipa);

  return [
    `Student: ${s.level.cefrEstimate}, conf ${s.level.confidence.toFixed(1)}`,
    topGrammar.length ? `Weak grammar: ${topGrammar.join(", ")}` : null,
    topSounds.length ? `Weak sounds: ${topSounds.join(", ")}` : null,
    `Recently covered: ${s.lastSessions.slice(0, 2).map(x => x.topic).join(", ") || "none"} — reinforce if still weak, prefer new topics`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function fullState(
  s: UserLearningState,
  area: "grammar" | "vocabulary" | "pronunciation" | "all"
): string {
  if (area === "grammar") return JSON.stringify(s.grammar, null, 2);
  if (area === "vocabulary") return JSON.stringify(s.vocabulary, null, 2);
  if (area === "pronunciation") return JSON.stringify(s.pronunciation, null, 2);
  return JSON.stringify(s, null, 2);
}

const EMA_ALPHA = 0.3;

export function applyExerciseResult(
  state: UserLearningState,
  r: ExerciseResult
): UserLearningState {
  const now = new Date().toISOString();
  const grammar = { ...state.grammar };
  const weakTopics = [...grammar.weakTopics];

  const topicIdx = weakTopics.findIndex(t => t.topic === r.topic);
  const errorValue = r.correct ? 0 : 1;

  if (topicIdx >= 0) {
    const existing = weakTopics[topicIdx];
    weakTopics[topicIdx] = {
      ...existing,
      errorRate: existing.errorRate * (1 - EMA_ALPHA) + errorValue * EMA_ALPHA,
      sampleCount: existing.sampleCount + 1,
      lastCoveredAt: now,
    };
  } else {
    weakTopics.push({
      topic: r.topic,
      errorRate: errorValue,
      sampleCount: 1,
      lastCoveredAt: now,
    });
  }

  // Adjust level confidence based on correctness
  const confidenceDelta = r.correct ? 0.02 : -0.03;
  const newConfidence = Math.max(0, Math.min(1, state.level.confidence + confidenceDelta));

  let pronunciation = state.pronunciation;
  if (r.gradedBy === "model" && r.score !== undefined) {
    pronunciation = {
      ...state.pronunciation,
      averageAccuracy:
        state.pronunciation.averageAccuracy * (1 - EMA_ALPHA) + r.score * 100 * EMA_ALPHA,
    };
  }

  return {
    ...state,
    updatedAt: now,
    grammar: { weakTopics },
    level: { ...state.level, confidence: newConfidence },
    pronunciation,
  };
}

export function createEmptyState(userId: string, deviceId: string): UserLearningState {
  return {
    userId,
    updatedAt: new Date().toISOString(),
    deviceId,
    level: { cefrEstimate: "B1", confidence: 0.5 },
    vocabulary: { knownCount: 0, strugglingWords: [], savedWords: [] },
    grammar: { weakTopics: [] },
    pronunciation: { averageAccuracy: 0, strugglingSounds: [] },
    lastSessions: [],
  };
}

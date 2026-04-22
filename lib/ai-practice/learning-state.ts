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

// ── Adaptive exercise selection ───────────────────────────────────────────────

export interface TopicSelection {
  topic: string;
  isNew: boolean;
}

/**
 * Picks the next exercise topic using a weighted priority score:
 *   errorRate * 0.6 + recencyDecay * 0.3 + jitter * 0.1
 *
 * 70% of picks come from known weak topics; 30% force a brand-new topic.
 * The topic most recently practiced is excluded to prevent consecutive repetition.
 */
export function selectNextExerciseTopic(
  state: UserLearningState,
  candidateTopics: string[],   // all available topics for this session
  lastTopic?: string,          // the immediately previous exercise topic
): TopicSelection {
  const now = Date.now();
  const weakTopics = state.grammar.weakTopics;

  // Seeded jitter so different calls still diverge
  const jitter = () => Math.random();

  // Recency decay: how long ago this topic was last practiced (normalised to ~7 days)
  function recencyDecay(lastCoveredAt: string): number {
    const ageMs = now - new Date(lastCoveredAt).getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    return Math.min(ageDays / 7, 1); // 0 = just practiced, 1 = ≥ 7 days ago
  }

  function score(topic: { topic: string; errorRate: number; lastCoveredAt: string }): number {
    return topic.errorRate * 0.6 + recencyDecay(topic.lastCoveredAt) * 0.3 + jitter() * 0.1;
  }

  // Eligible weak topics: exclude the immediately previous topic
  const eligible = weakTopics.filter(
    t => t.topic !== lastTopic && t.sampleCount > 0,
  );

  // New topics = candidates not yet in weakTopics
  const knownTopicSet = new Set(weakTopics.map(t => t.topic));
  const newTopics = candidateTopics.filter(t => t !== lastTopic && !knownTopicSet.has(t));

  const forceNew = Math.random() < 0.3 || eligible.length === 0;

  if (forceNew && newTopics.length > 0) {
    const idx = Math.floor(Math.random() * newTopics.length);
    return { topic: newTopics[idx], isNew: true };
  }

  if (eligible.length > 0) {
    const best = eligible.reduce((a, b) => (score(a) >= score(b) ? a : b));
    return { topic: best.topic, isNew: false };
  }

  // Fallback: any candidate not equal to lastTopic
  const fallbacks = candidateTopics.filter(t => t !== lastTopic);
  if (fallbacks.length > 0) {
    return { topic: fallbacks[Math.floor(Math.random() * fallbacks.length)], isNew: true };
  }

  // Last resort: repeat last topic
  return { topic: candidateTopics[0] ?? "general", isNew: true };
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

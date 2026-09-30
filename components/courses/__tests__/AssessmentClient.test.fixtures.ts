import type { AssessmentQuestion } from "@/lib/courses/assessment";
import type { AssessmentConcept } from "@/lib/courses/concept-profile";

export const passingResult = {
  assignedLevel: "A2",
  evaluatedLevels: ["a1"],
  confidence: "medium",
  passed: true,
  passedLevels: ["a1"],
  score: 1,
  total: 1,
  listeningScore: 1,
  listeningTotal: 1,
  topicScores: [{ lessonSlug: "a1-topic-one", title: "topic one", correct: 1, total: 1 }],
  strengths: [{ lessonSlug: "a1-topic-one", title: "topic one" }],
  needsReview: [],
  conceptSignals: [],
};

export const failedResult = {
  ...passingResult,
  assignedLevel: "A1",
  passed: false,
  passedLevels: [],
  score: 0,
  listeningScore: 0,
  strengths: [],
  needsReview: [{ lessonSlug: "a1-topic-one", title: "topic one" }],
};

export const pendingOralResult = {
  ...passingResult,
  assignedLevel: "A1",
  passed: false,
  passedLevels: [],
  oralEvidence: { level: "a1", status: "pending" },
  levelScores: [{
    level: "a1",
    correct: 1,
    total: 1,
    minimumCorrect: 1,
    listeningCorrect: 1,
    listeningTotal: 1,
    minimumListeningCorrect: 1,
    writtenListeningMet: true,
    oralRequired: true,
    oralPassed: false,
    thresholdMet: false,
  }],
};

export function responseWithResult(result: typeof passingResult | typeof failedResult) {
  return { ok: true, json: async () => ({ result }) };
}

export const questions: AssessmentQuestion[] = [
  {
    id: "a1:topic-one",
    level: "a1",
    lessonSlug: "a1-topic-one",
    prompt: "Choose one",
    options: ["Wrong", "Right"],
    answer: 1,
  },
];

export const checkpointQuestions: AssessmentQuestion[] = [
  ...questions,
  {
    id: "a1:topic-two",
    level: "a1",
    lessonSlug: "a1-topic-two",
    prompt: "Choose two",
    options: ["Wrong again", "Right again"],
    answer: 1,
  },
];

export const placementQuestions: AssessmentQuestion[] = [
  ...questions,
  {
    id: "a2:topic-two",
    level: "a2",
    lessonSlug: "a2-topic-two",
    prompt: "Choose two",
    options: ["Wrong again", "Right again"],
    answer: 1,
  },
];

export const concepts: AssessmentConcept[] = [
  { lessonSlug: "a1-topic-one", level: "a1", title: "Present simple", goal: "Hablar de hábitos." },
  { lessonSlug: "a2-topic-two", level: "a2", title: "Past simple", goal: "Hablar del pasado." },
];

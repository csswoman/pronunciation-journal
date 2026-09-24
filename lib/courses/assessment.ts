import "server-only";
import type { CefrLevel } from "@/lib/essential-words/types";
import type { CefrLevelId } from "@/lib/courses/types";
import type { GrammarQuizQuestion } from "@/lib/courses/grammar-deck/types";
import { LEVEL_ASSESSMENT_CONTRACTS, buildAssessment } from "@/lib/courses/curriculum";
import { LISTENING_BANK, listeningAudioSrc } from "@/lib/courses/listening-bank";
import { ASSESSMENT_LEVEL_ORDER } from "@/lib/courses/assessment-shared";
import { requiresCheckpointOralEvidence, type AssessmentOralEvidenceStatus } from "@/lib/courses/assessment-oral-shared";
import { buildAssessmentOralResultDetails } from "@/lib/courses/assessment-oral-result";
import {
  buildAssessmentResultDetails,
  deriveAssessmentNeedsReview,
  resolveAssessmentTopicTitle,
  type AssessmentLevelScore,
  type AssessmentQuestionFeedback,
  type AssessmentQuestionOutcome,
} from "@/lib/courses/assessment-result-details";
export type {
  AssessmentLevelScore,
  AssessmentQuestionFeedback,
  AssessmentQuestionOutcome,
} from "@/lib/courses/assessment-result-details";
export { ASSESSMENT_LEVEL_ORDER, assessmentAnchorIndex, groupQuestionsByLevel } from "@/lib/courses/assessment-shared";
import {
  deriveConceptSignal,
  type AssessmentConcept,
  type ConceptSelfRating,
  type ConceptSignal,
} from "@/lib/courses/concept-profile";

export interface AssessmentQuestion {
  id: string;
  level: CefrLevelId;
  lessonSlug: string;
  topicTitle?: string;
  prompt: string;
  options: string[];
  answer: number;
  type?: "grammar" | "vocabulary" | "reading" | "listening";
  explanation?: string;
  passage?: string;
  audioSrc?: string;
}

export type ClientAssessmentQuestion = Omit<AssessmentQuestion, "answer" | "explanation">;

export interface AssessmentResult {
  assignedLevel: CefrLevel;
  evaluatedLevels?: CefrLevelId[];
  confidence?: "low" | "medium" | "high";
  passed: boolean;
  passedLevels: CefrLevelId[];
  score: number;
  total: number;
  listeningScore: number;
  listeningTotal: number;
  topicScores: Array<{ lessonSlug: string; title: string; correct: number; total: number }>;
  strengths: Array<{ lessonSlug: string; title: string }>;
  needsReview: Array<{ lessonSlug: string; title: string; lessonHref?: string }>;
  conceptSignals: ConceptSignal[];
  levelScores?: AssessmentLevelScore[];
  questionOutcomes?: AssessmentQuestionOutcome[];
  questionFeedback?: AssessmentQuestionFeedback[];
  oralEvidence?: AssessmentOralEvidenceStatus;
}

const READING_QUESTIONS: Record<CefrLevelId, AssessmentQuestion[]> = {
  a1: [
    {
      id: "a1:reading:1", level: "a1", lessonSlug: "a1-reading-daily-life",
      passage: "Mia works in a café. She starts at eight and finishes at three. She usually walks home.",
      prompt: "What time does Mia start work?", options: ["At eight", "At three", "At night"], answer: 0,
    },
    {
      id: "a1:reading:2", level: "a1", lessonSlug: "a1-reading-daily-life",
      passage: "Mia works in a café. She starts at eight and finishes at three. She usually walks home.",
      prompt: "How does Mia usually go home?", options: ["By bus", "On foot", "By car"], answer: 1,
    },
  ],
  a2: [
    {
      id: "a2:reading:1", level: "a2", lessonSlug: "a2-reading-plans",
      passage: "Next weekend, Leo is visiting his grandparents in Madrid. He has already bought the train tickets.",
      prompt: "Where is Leo going next weekend?", options: ["To Barcelona", "To Madrid", "To London"], answer: 1,
    },
    {
      id: "a2:reading:2", level: "a2", lessonSlug: "a2-reading-plans",
      passage: "Next weekend, Leo is visiting his grandparents in Madrid. He has already bought the train tickets.",
      prompt: "Has Leo bought his tickets yet?", options: ["Yes, he has", "No, not yet", "He is buying them now"], answer: 0,
    },
  ],
  b1: [
    {
      id: "b1:reading:1", level: "b1", lessonSlug: "b1-reading-experience",
      passage: "Sara has been studying software development for two years. Before that, she worked as a graphic designer.",
      prompt: "What was Sara's previous profession?", options: ["Software engineer", "Graphic designer", "Teacher"], answer: 1,
    },
    {
      id: "b1:reading:2", level: "b1", lessonSlug: "b1-reading-experience",
      passage: "Sara has been studying software development for two years. Before that, she worked as a graphic designer.",
      prompt: "How long has Sara been studying software development?", options: ["Two months", "Two years", "Five years"], answer: 1,
    },
  ],
  b2: [
    {
      id: "b2:reading:1", level: "b2", lessonSlug: "b2-reading-workplace",
      passage: "The company introduced flexible hours to improve retention. Although productivity remained stable, managers found that coordinating meetings became more difficult. The policy was retained, but teams were asked to establish shared availability periods.",
      prompt: "What was the main reason for introducing flexible hours?", options: ["To reduce costs", "To improve retention", "To cancel meetings"], answer: 1,
    },
    {
      id: "b2:reading:2", level: "b2", lessonSlug: "b2-reading-workplace",
      passage: "The company introduced flexible hours to improve retention. Although productivity remained stable, managers found that coordinating meetings became more difficult. The policy was retained, but teams were asked to establish shared availability periods.",
      prompt: "What compromise was introduced?", options: ["Fewer meetings", "Common availability windows", "Mandatory office days"], answer: 1,
    },
  ],
  c1: [
    {
      id: "c1:reading:1", level: "c1", lessonSlug: "c1-reading-evidence",
      passage: "While the findings appear to support the intervention, the sample was relatively small and participants were self-selected. The results should therefore be treated as suggestive rather than conclusive.",
      prompt: "What is the writer's main reservation?", options: ["The intervention was too expensive", "The evidence has methodological limitations", "The participants misunderstood the study"], answer: 1,
    },
    {
      id: "c1:reading:2", level: "c1", lessonSlug: "c1-reading-evidence",
      passage: "While the findings appear to support the intervention, the sample was relatively small and participants were self-selected. The results should therefore be treated as suggestive rather than conclusive.",
      prompt: "What does “suggestive rather than conclusive” imply?", options: ["The results indicate a possibility but do not prove it", "The results are deliberately misleading", "The results contradict the intervention"], answer: 0,
    },
  ],
  c2: [
    {
      id: "c2:reading:1", level: "c2", lessonSlug: "c2-reading-stylistics",
      passage: "Seldom does a framework command such instant consensus without provoking underlying friction regarding implementation details. The apparent unanimity masks subtle divergent interpretations.",
      prompt: "What does the text suggest about the agreement?", options: ["It is complete and unambiguous", "It is superficial and hides underlying differences", "It was rejected by the team"], answer: 1,
    },
    {
      id: "c2:reading:2", level: "c2", lessonSlug: "c2-reading-stylistics",
      passage: "Seldom does a framework command such instant consensus without provoking underlying friction regarding implementation details. The apparent unanimity masks subtle divergent interpretations.",
      prompt: "Which literary/rhetorical device opens the passage?", options: ["Subject-verb inversion following a negative adverb", "A second conditional clause", "A cleft sentence"], answer: 0,
    },
  ],
};

function nextLevel(level: CefrLevelId): CefrLevelId {
  const index = ASSESSMENT_LEVEL_ORDER.indexOf(level);
  return ASSESSMENT_LEVEL_ORDER[Math.min(index + 1, ASSESSMENT_LEVEL_ORDER.length - 1)];
}

export function buildAssessmentQuestions(
  mode: "placement" | "checkpoint",
  quizzes: Record<string, GrammarQuizQuestion[]>,
  checkpointLevel?: CefrLevelId,
): AssessmentQuestion[] {
  return buildAssessment(mode, checkpointLevel).flatMap((section) => {
    const contract = LEVEL_ASSESSMENT_CONTRACTS[section.level];
    const authoredLimit = contract.questionCount
      - READING_QUESTIONS[section.level].length
      - contract.listeningQuestionCount;
    const authored: AssessmentQuestion[] = [];
    const availableItems = section.items.filter((item) => quizzes[item.lessonSlug]?.length);
    const maximumQuizLength = Math.max(0, ...availableItems.map((item) => quizzes[item.lessonSlug].length));

    for (let quizIndex = 0; quizIndex < maximumQuizLength && authored.length < authoredLimit; quizIndex += 1) {
      for (const item of availableItems) {
        const question = quizzes[item.lessonSlug][quizIndex];
        if (!question) continue;
        authored.push({
          id: `${section.level}:${item.lessonSlug}:${quizIndex}`,
          level: section.level,
          lessonSlug: item.lessonSlug,
          prompt: question.q,
          options: question.options,
          answer: question.answer,
          type: item.questionType,
          explanation: question.explain,
        });
        if (authored.length === authoredLimit) break;
      }
    }
    const listening = LISTENING_BANK[section.level].flatMap((item) => item.questions.map((question) => ({
      id: question.id,
      level: section.level,
      lessonSlug: item.lessonSlug,
      prompt: question.prompt,
      options: question.options,
      answer: question.answer,
      type: "listening" as const,
      audioSrc: listeningAudioSrc(item.id),
    })));
    return [...authored, ...READING_QUESTIONS[section.level], ...listening];
  });
}

/** Removes server-only answer keys and explanations before a question crosses into the client tree. */
export function toClientAssessmentQuestions(
  questions: AssessmentQuestion[],
): ClientAssessmentQuestion[] {
  return questions.map((question) => ({
    id: question.id,
    level: question.level,
    lessonSlug: question.lessonSlug,
    prompt: question.prompt,
    options: question.options,
    ...(question.type ? { type: question.type } : {}),
    ...(question.passage ? { passage: question.passage } : {}),
    ...(question.audioSrc ? { audioSrc: question.audioSrc } : {}),
  }));
}

export function levelPassed(
  level: CefrLevelId,
  questions: AssessmentQuestion[],
  answers: Record<string, number>,
): boolean {
  const correct = questions.filter((question) => answers[question.id] === question.answer).length;
  const listeningQuestions = questions.filter((question) => question.type === "listening");
  const listeningCorrect = listeningQuestions.filter((question) => answers[question.id] === question.answer).length;
  const contract = LEVEL_ASSESSMENT_CONTRACTS[level];
  return questions.length === contract.questionCount
    && listeningQuestions.length === contract.listeningQuestionCount
    && correct >= contract.minimumCorrect
    && listeningCorrect >= contract.minimumListeningCorrect;
}

export function scoreAssessment(
  questions: AssessmentQuestion[],
  answers: Record<string, number>,
  mode: "placement" | "checkpoint" = "placement",
  checkpointLevel?: CefrLevelId,
  concepts: AssessmentConcept[] = [],
  selfRatings: Record<string, ConceptSelfRating> = {},
  oralEvidencePassed = false,
): AssessmentResult {
  const oralRequired = mode === "checkpoint" && checkpointLevel !== undefined
    && requiresCheckpointOralEvidence(checkpointLevel);
  const passedLevels: CefrLevelId[] = [];
  const topicMap = new Map<string, { correct: number; total: number }>();
  let listeningScore = 0;
  let listeningTotal = 0;

  for (const question of questions) {
    const topic = topicMap.get(question.lessonSlug) ?? { correct: 0, total: 0 };
    topic.total += 1;
    if (question.type === "listening") listeningTotal += 1;
    if (answers[question.id] === question.answer) {
      topic.correct += 1;
      if (question.type === "listening") listeningScore += 1;
    }
    topicMap.set(question.lessonSlug, topic);
  }

  for (const level of ASSESSMENT_LEVEL_ORDER) {
    const levelQuestions = questions.filter((question) => question.level === level);
    if (levelQuestions.length === 0) continue;
    const correct = levelQuestions.filter((question) => answers[question.id] === question.answer).length;
    const listeningQuestions = levelQuestions.filter((question) => question.type === "listening");
    const listeningCorrect = listeningQuestions.filter((question) => answers[question.id] === question.answer).length;
    const contract = LEVEL_ASSESSMENT_CONTRACTS[level];
    const completeQuestionSet = levelQuestions.length === contract.questionCount
      && listeningQuestions.length === contract.listeningQuestionCount;
    if (
      completeQuestionSet
      && correct >= contract.minimumCorrect
      && listeningCorrect >= contract.minimumListeningCorrect
      && (!oralRequired || level !== checkpointLevel || oralEvidencePassed)
    ) passedLevels.push(level);
    else break;
  }

  const checkpointPassed = Boolean(
    checkpointLevel && passedLevels.includes(checkpointLevel),
  );
  const assigned = mode === "checkpoint" && checkpointLevel
    ? (checkpointPassed ? nextLevel(checkpointLevel) : checkpointLevel)
    : (passedLevels.at(-1)
      ?? LEVEL_ASSESSMENT_CONTRACTS[questions[0]?.level ?? "a1"].failureFallback);
  const score = questions.filter((question) => answers[question.id] === question.answer).length;
  const topicScores = [...topicMap].map(([lessonSlug, value]) => ({
    lessonSlug,
    title: resolveAssessmentTopicTitle(questions, lessonSlug),
    ...value,
  }));
  const resultDetails = buildAssessmentResultDetails(questions, answers);
  const oralResultDetails = buildAssessmentOralResultDetails({
    levelScores: resultDetails.levelScores, mode, checkpointLevel, oralEvidencePassed,
  });
  const assessedAt = new Date().toISOString();
  const conceptSignals = concepts.map((concept) => deriveConceptSignal(
    concept,
    selfRatings[concept.lessonSlug] ?? "unknown",
    topicMap.get(concept.lessonSlug) ?? { correct: 0, total: 0 },
    assessedAt,
  ));
  const needsReview = deriveAssessmentNeedsReview(topicScores, conceptSignals, questions.length === 0);

  return {
    assignedLevel: assigned.toUpperCase() as CefrLevel,
    evaluatedLevels: [...new Set(questions.map((question) => question.level))],
    confidence: questions.length >= 18 ? "high" : questions.length >= 10 ? "medium" : "low",
    passed: mode === "checkpoint" ? checkpointPassed : passedLevels.length > 0,
    passedLevels,
    score,
    total: questions.length,
    listeningScore,
    listeningTotal,
    topicScores,
    strengths: topicScores
      .filter((topic) => topic.correct === topic.total)
      .map(({ lessonSlug, title }) => ({ lessonSlug, title })),
    needsReview,
    conceptSignals,
    ...resultDetails,
    ...oralResultDetails,
  };
}

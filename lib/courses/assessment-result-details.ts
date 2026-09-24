import type { CefrLevelId } from "@/lib/courses/types";
import { LEVEL_ASSESSMENT_CONTRACTS } from "@/lib/courses/curriculum";
import { ASSESSMENT_LEVEL_ORDER } from "@/lib/courses/assessment-shared";
import { studyOrPracticeDeckHref } from "@/lib/courses/curriculumIndex";
import type { AssessmentQuestion } from "@/lib/courses/assessment";
import type { ConceptSignal } from "@/lib/courses/concept-profile";

interface AssessmentTopicScore {
  lessonSlug: string;
  title: string;
  correct: number;
  total: number;
}

export interface AssessmentReviewTopic {
  lessonSlug: string;
  title: string;
  lessonHref: string;
}

export function resolveAssessmentLessonHref(lessonSlug: string): string {
  return studyOrPracticeDeckHref(lessonSlug);
}

export function resolveAssessmentTopicTitle(
  questions: AssessmentQuestion[],
  lessonSlug: string,
): string {
  const questionTitle = questions.find((question) => question.lessonSlug === lessonSlug)?.topicTitle;
  return questionTitle
    ?? lessonSlug.replace(/^[a-z]\d-/, "").replaceAll("-", " ");
}

export function deriveAssessmentNeedsReview(
  topicScores: AssessmentTopicScore[],
  conceptSignals: ConceptSignal[],
  includeStarterTopics: boolean,
): AssessmentReviewTopic[] {
  const topicsBySlug = new Map<string, AssessmentReviewTopic>();
  for (const topic of topicScores) {
    if (topic.correct < topic.total) {
      topicsBySlug.set(topic.lessonSlug, {
        lessonSlug: topic.lessonSlug,
        title: topic.title,
        lessonHref: resolveAssessmentLessonHref(topic.lessonSlug),
      });
    }
  }

  if (includeStarterTopics) {
    for (const signal of conceptSignals) {
      if (signal.status === "learn") {
        topicsBySlug.set(signal.lessonSlug, {
          lessonSlug: signal.lessonSlug,
          title: signal.title,
          lessonHref: resolveAssessmentLessonHref(signal.lessonSlug),
        });
      }
    }
  }

  return [...topicsBySlug.values()];
}

export interface AssessmentLevelScore {
  level: CefrLevelId;
  correct: number;
  total: number;
  minimumCorrect: number;
  listeningCorrect: number;
  listeningTotal: number;
  minimumListeningCorrect: number;
  thresholdMet: boolean;
}

export interface AssessmentQuestionOutcome {
  questionId: string;
  level: CefrLevelId;
  questionNumber: number;
  correct: boolean;
}

export interface AssessmentQuestionFeedback extends AssessmentQuestionOutcome {
  lessonSlug: string;
  topicTitle: string;
  prompt: string;
  selectedAnswer: string | null;
  correctAnswer: string;
  explanation?: string;
}

export function buildAssessmentResultDetails(
  questions: AssessmentQuestion[],
  answers: Record<string, number>,
): {
  levelScores: AssessmentLevelScore[];
  questionOutcomes: AssessmentQuestionOutcome[];
  questionFeedback: AssessmentQuestionFeedback[];
} {
  const levelScores = ASSESSMENT_LEVEL_ORDER.flatMap((level) => {
    const levelQuestions = questions.filter((question) => question.level === level);
    if (levelQuestions.length === 0) return [];

    const contract = LEVEL_ASSESSMENT_CONTRACTS[level];
    const correct = levelQuestions.filter((question) => answers[question.id] === question.answer).length;
    const listeningQuestions = levelQuestions.filter((question) => question.type === "listening");
    const listeningCorrect = listeningQuestions.filter((question) => answers[question.id] === question.answer).length;
    const completeQuestionSet = levelQuestions.length === contract.questionCount
      && listeningQuestions.length === contract.listeningQuestionCount;

    return [{
      level,
      correct,
      total: levelQuestions.length,
      minimumCorrect: contract.minimumCorrect,
      listeningCorrect,
      listeningTotal: listeningQuestions.length,
      minimumListeningCorrect: contract.minimumListeningCorrect,
      thresholdMet: completeQuestionSet
        && correct >= contract.minimumCorrect
        && listeningCorrect >= contract.minimumListeningCorrect,
    }];
  });

  const questionNumbers = new Map<CefrLevelId, number>();
  const questionOutcomes = questions.map((question): AssessmentQuestionOutcome => {
    const questionNumber = (questionNumbers.get(question.level) ?? 0) + 1;
    questionNumbers.set(question.level, questionNumber);
    return {
      questionId: question.id,
      level: question.level,
      questionNumber,
      correct: answers[question.id] === question.answer,
    };
  });
  const questionById = new Map(questions.map((question) => [question.id, question]));
  const questionFeedback = questionOutcomes.flatMap((outcome): AssessmentQuestionFeedback[] => {
    if (outcome.correct) return [];
    const question = questionById.get(outcome.questionId);
    if (!question) return [];
    const selectedIndex = answers[question.id];
    const selectedAnswer = selectedIndex !== undefined && Number.isInteger(selectedIndex)
      ? question.options[selectedIndex] ?? null
      : null;

    return [{
      ...outcome,
      lessonSlug: question.lessonSlug,
      topicTitle: resolveAssessmentTopicTitle(questions, question.lessonSlug),
      prompt: question.prompt,
      selectedAnswer,
      correctAnswer: question.options[question.answer] ?? "Respuesta correcta no disponible",
      ...(question.explanation ? { explanation: question.explanation } : {}),
    }];
  });

  return { levelScores, questionOutcomes, questionFeedback };
}

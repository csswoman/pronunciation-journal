import type { CefrLevel } from "@/lib/core-1000/types";
import type { CefrLevelId } from "@/lib/courses/types";
import type { GrammarQuizQuestion } from "@/lib/courses/grammar-deck/types";
import { LEVEL_ASSESSMENT_CONTRACTS, buildAssessment } from "@/lib/courses/curriculum";

export interface AssessmentQuestion {
  id: string;
  level: CefrLevelId;
  lessonSlug: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation?: string;
  passage?: string;
}

export interface AssessmentResult {
  assignedLevel: CefrLevel;
  passed: boolean;
  passedLevels: CefrLevelId[];
  score: number;
  total: number;
  topicScores: Array<{ lessonSlug: string; title: string; correct: number; total: number }>;
  strengths: Array<{ lessonSlug: string; title: string }>;
  needsReview: Array<{ lessonSlug: string; title: string }>;
}

const CEFR_ORDER: CefrLevelId[] = ["a1", "a2", "b1", "b2", "c1"];
const QUESTIONS_PER_LEVEL = 10;

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
      passage: "Leo has booked a train to Brighton for Saturday. He is going to visit an old friend, but he has not chosen where to stay yet.",
      prompt: "Why is Leo going to Brighton?", options: ["To work", "To visit a friend", "To find a hotel"], answer: 1,
    },
    {
      id: "a2:reading:2", level: "a2", lessonSlug: "a2-reading-plans",
      passage: "Leo has booked a train to Brighton for Saturday. He is going to visit an old friend, but he has not chosen where to stay yet.",
      prompt: "What has Leo not decided?", options: ["When to travel", "Who to visit", "Where to stay"], answer: 2,
    },
  ],
  b1: [
    {
      id: "b1:reading:1", level: "b1", lessonSlug: "b1-reading-remote-work",
      passage: "Nora enjoyed working remotely at first because she could organize her day. After several months, however, she missed informal conversations with colleagues, so she began using a co-working space twice a week.",
      prompt: "What changed Nora's remote-work routine?", options: ["She needed faster internet", "She felt socially isolated", "Her employer required it"], answer: 1,
    },
    {
      id: "b1:reading:2", level: "b1", lessonSlug: "b1-reading-remote-work",
      passage: "Nora enjoyed working remotely at first because she could organize her day. After several months, however, she missed informal conversations with colleagues, so she began using a co-working space twice a week.",
      prompt: "How often does Nora use the co-working space?", options: ["Every day", "Once a month", "Twice a week"], answer: 2,
    },
  ],
  b2: [
    {
      id: "b2:reading:1", level: "b2", lessonSlug: "b2-reading-policy",
      passage: "The company introduced flexible hours to improve retention. Although productivity remained stable, managers found that coordinating meetings became more difficult. The policy was retained, but teams were asked to establish shared availability periods.",
      prompt: "Why did the company retain the policy?", options: ["Productivity did not decline", "Meetings became easier", "Managers rejected fixed schedules"], answer: 0,
    },
    {
      id: "b2:reading:2", level: "b2", lessonSlug: "b2-reading-policy",
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
};

function lessonTitle(slug: string): string {
  return slug.replace(/^[a-z]\d-/, "").replaceAll("-", " ");
}

function nextLevel(level: CefrLevelId): CefrLevelId {
  const index = CEFR_ORDER.indexOf(level);
  return CEFR_ORDER[Math.min(index + 1, CEFR_ORDER.length - 1)];
}

export function buildAssessmentQuestions(
  mode: "placement" | "checkpoint",
  quizzes: Record<string, GrammarQuizQuestion[]>,
  checkpointLevel?: CefrLevelId,
): AssessmentQuestion[] {
  return buildAssessment(mode, checkpointLevel).flatMap((section) => {
    const authored = section.items.flatMap((item) => {
      const quiz = quizzes[item.lessonSlug];
      if (!quiz?.length) return [];
      const selected = quiz.slice(0, 2);
      return selected.map((question, quizIndex) => ({
        id: `${section.level}:${item.lessonSlug}:${quizIndex}`,
        level: section.level,
        lessonSlug: item.lessonSlug,
        prompt: question.q,
        options: question.options,
        answer: question.answer,
        explanation: question.explain,
      }));
    }).slice(0, QUESTIONS_PER_LEVEL - READING_QUESTIONS[section.level].length);
    return [...authored, ...READING_QUESTIONS[section.level]];
  });
}

export function groupQuestionsByLevel(
  questions: AssessmentQuestion[],
): Array<{ level: CefrLevelId; questions: AssessmentQuestion[] }> {
  return CEFR_ORDER
    .map((level) => ({ level, questions: questions.filter((question) => question.level === level) }))
    .filter((section) => section.questions.length > 0);
}

export function levelPassed(
  level: CefrLevelId,
  questions: AssessmentQuestion[],
  answers: Record<string, number>,
): boolean {
  const correct = questions.filter((question) => answers[question.id] === question.answer).length;
  const contract = LEVEL_ASSESSMENT_CONTRACTS[level];
  return correct >= Math.ceil((contract.minimumCorrect / contract.questionCount) * questions.length);
}

export function scoreAssessment(
  questions: AssessmentQuestion[],
  answers: Record<string, number>,
  mode: "placement" | "checkpoint" = "placement",
  checkpointLevel?: CefrLevelId,
): AssessmentResult {
  const passedLevels: CefrLevelId[] = [];
  const topicMap = new Map<string, { correct: number; total: number }>();

  for (const question of questions) {
    const topic = topicMap.get(question.lessonSlug) ?? { correct: 0, total: 0 };
    topic.total += 1;
    if (answers[question.id] === question.answer) topic.correct += 1;
    topicMap.set(question.lessonSlug, topic);
  }

  for (const level of CEFR_ORDER) {
    const levelQuestions = questions.filter((question) => question.level === level);
    if (levelQuestions.length === 0) continue;
    const correct = levelQuestions.filter((question) => answers[question.id] === question.answer).length;
    const contract = LEVEL_ASSESSMENT_CONTRACTS[level];
    const threshold = Math.ceil((contract.minimumCorrect / contract.questionCount) * levelQuestions.length);
    if (correct >= threshold) passedLevels.push(level);
    else break;
  }

  const checkpointPassed = Boolean(
    checkpointLevel && passedLevels.includes(checkpointLevel),
  );
  const assigned = mode === "checkpoint" && checkpointLevel
    ? (checkpointPassed ? nextLevel(checkpointLevel) : checkpointLevel)
    : (passedLevels.at(-1) ?? "a1");
  const score = questions.filter((question) => answers[question.id] === question.answer).length;
  const topicScores = [...topicMap].map(([lessonSlug, value]) => ({
    lessonSlug,
    title: lessonTitle(lessonSlug),
    ...value,
  }));

  return {
    assignedLevel: assigned.toUpperCase() as CefrLevel,
    passed: mode === "checkpoint" ? checkpointPassed : passedLevels.length > 0,
    passedLevels,
    score,
    total: questions.length,
    topicScores,
    strengths: topicScores
      .filter((topic) => topic.correct === topic.total)
      .map(({ lessonSlug, title }) => ({ lessonSlug, title })),
    needsReview: topicScores
      .filter((topic) => topic.correct < topic.total)
      .map(({ lessonSlug, title }) => ({ lessonSlug, title })),
  };
}

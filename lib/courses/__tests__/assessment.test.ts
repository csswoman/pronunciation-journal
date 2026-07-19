import { describe, expect, it } from "vitest";
import {
  buildAssessmentQuestions,
  groupQuestionsByLevel,
  levelPassed,
  scoreAssessment,
} from "../assessment";

const quizzes = {
  "a1-verbo-to-be": [{ q: "I ___ ready.", options: ["am", "is"], answer: 0 }],
  "a1-presente-simple": [{ q: "She ___ here.", options: ["work", "works"], answer: 1 }],
  "a1-articulos-basicos": [{ q: "___ apple", options: ["a", "an"], answer: 1 }],
  "a1-there-is-there-are": [{ q: "There ___ two.", options: ["is", "are"], answer: 1 }],
  "a1-preguntas-do-does": [{ q: "___ he work?", options: ["Do", "Does"], answer: 1 }],
  "a1-can-capacidad-permiso": [{ q: "I can ___.", options: ["swim", "swims"], answer: 0 }],
};

const concepts = [
  { lessonSlug: "a1-verbo-to-be", level: "a1" as const, title: "Verbo to be" },
  { lessonSlug: "a1-presente-simple", level: "a1" as const, title: "Presente simple" },
  { lessonSlug: "a1-sin-preguntas", level: "a1" as const, title: "Tema sin preguntas" },
];

describe("curriculum assessments", () => {
  it("builds checkpoint questions from authored deck quizzes", () => {
    expect(buildAssessmentQuestions("checkpoint", quizzes, "a1")).toHaveLength(8);
    expect(buildAssessmentQuestions("checkpoint", quizzes, "a1").filter((question) => question.passage)).toHaveLength(2);
  });

  it("samples every authored concept before taking additional questions", () => {
    const expandedQuizzes = Object.fromEntries(Object.entries(quizzes).map(([slug, questions]) => [
      slug,
      [...questions, { ...questions[0], q: `${questions[0].q} again` }],
    ]));
    const questions = buildAssessmentQuestions("checkpoint", expandedQuizzes, "a1");
    const authored = questions.filter((question) => !question.passage);

    expect(authored).toHaveLength(8);
    expect(new Set(authored.slice(0, 6).map((question) => question.lessonSlug))).toEqual(
      new Set(Object.keys(quizzes)),
    );
  });

  it("promotes to the next level after passing a checkpoint", () => {
    const questions = buildAssessmentQuestions("checkpoint", quizzes, "a1");
    const answers = Object.fromEntries(questions.map((question) => [question.id, question.answer]));
    const result = scoreAssessment(questions, answers, "checkpoint", "a1");

    expect(result.assignedLevel).toBe("A2");
    expect(result.passed).toBe(true);
    expect(result.score).toBe(8);
    expect(result.topicScores).toHaveLength(7);
  });

  it("keeps the evaluated level when a checkpoint is failed", () => {
    const questions = buildAssessmentQuestions("checkpoint", quizzes, "a1");
    const result = scoreAssessment(questions, {}, "checkpoint", "a1");

    expect(result.assignedLevel).toBe("A1");
    expect(result.passed).toBe(false);
    expect(result.needsReview).toHaveLength(7);
  });

  it("marks confident but incorrect knowledge for review", () => {
    const questions = buildAssessmentQuestions("checkpoint", quizzes, "a1");
    const result = scoreAssessment(
      questions,
      {},
      "checkpoint",
      "a1",
      concepts,
      { "a1-verbo-to-be": "confident" },
    );

    expect(result.conceptSignals[0]).toMatchObject({
      lessonSlug: "a1-verbo-to-be",
      selfRating: "confident",
      status: "review",
      correct: 0,
      total: 1,
    });
  });

  it("marks unknown concepts with errors or no evidence to learn", () => {
    const questions = buildAssessmentQuestions("checkpoint", quizzes, "a1");
    const result = scoreAssessment(questions, {}, "checkpoint", "a1", concepts, {
      "a1-verbo-to-be": "unknown",
      "a1-sin-preguntas": "unknown",
    });

    expect(result.conceptSignals[0].status).toBe("learn");
    expect(result.conceptSignals[2]).toMatchObject({ status: "learn", correct: 0, total: 0 });
  });

  it("derives mastery from perfect evidence and keeps old calls compatible", () => {
    const questions = buildAssessmentQuestions("checkpoint", quizzes, "a1");
    const answers = { [questions[0].id]: questions[0].answer };
    const legacyResult = scoreAssessment(questions, answers, "checkpoint", "a1");
    const conceptualResult = scoreAssessment(questions, answers, "checkpoint", "a1", concepts, {
      "a1-verbo-to-be": "familiar",
    });

    expect(legacyResult.conceptSignals).toEqual([]);
    expect(conceptualResult.conceptSignals[0].status).toBe("mastered");
  });

  it("groups placement questions by level for adaptive progression", () => {
    const questions = buildAssessmentQuestions("checkpoint", quizzes, "a1");
    const [section] = groupQuestionsByLevel(questions);
    const correct = Object.fromEntries(section.questions.map((question) => [question.id, question.answer]));

    expect(section.level).toBe("a1");
    expect(levelPassed("a1", section.questions, correct)).toBe(true);
    expect(levelPassed("a1", section.questions, {})).toBe(false);
  });
});

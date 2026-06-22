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

describe("curriculum assessments", () => {
  it("builds checkpoint questions from authored deck quizzes", () => {
    expect(buildAssessmentQuestions("checkpoint", quizzes, "a1")).toHaveLength(8);
    expect(buildAssessmentQuestions("checkpoint", quizzes, "a1").filter((question) => question.passage)).toHaveLength(2);
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

  it("groups placement questions by level for adaptive progression", () => {
    const questions = buildAssessmentQuestions("checkpoint", quizzes, "a1");
    const [section] = groupQuestionsByLevel(questions);
    const correct = Object.fromEntries(section.questions.map((question) => [question.id, question.answer]));

    expect(section.level).toBe("a1");
    expect(levelPassed("a1", section.questions, correct)).toBe(true);
    expect(levelPassed("a1", section.questions, {})).toBe(false);
  });
});

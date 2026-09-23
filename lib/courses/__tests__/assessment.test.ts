import { describe, expect, it, vi } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
vi.mock("server-only", () => ({}));
import {
  buildAssessmentQuestions,
  groupQuestionsByLevel,
  levelPassed,
  scoreAssessment,
  toClientAssessmentQuestions,
} from "../assessment";
import { buildServerAssessment } from "../server-assessment";
import { allListeningItems, LISTENING_BANK, listeningAudioSrc } from "../listening-bank";

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
    const questions = buildAssessmentQuestions("checkpoint", quizzes, "a1");
    expect(questions).toHaveLength(14);
    expect(questions.filter((question) => question.passage)).toHaveLength(2);
    expect(questions.filter((question) => question.type === "listening")).toHaveLength(6);
  });

  it("samples every authored concept before taking additional questions", () => {
    const expandedQuizzes = Object.fromEntries(Object.entries(quizzes).map(([slug, questions]) => [
      slug,
      [...questions, { ...questions[0], q: `${questions[0].q} again` }],
    ]));
    const questions = buildAssessmentQuestions("checkpoint", expandedQuizzes, "a1");
    const authored = questions.filter((question) => !question.passage && question.type !== "listening");

    expect(authored).toHaveLength(6);
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
    expect(result.score).toBe(14);
    expect(result.listeningScore).toBe(6);
    expect(result.listeningTotal).toBe(6);
    expect(result.topicScores).toHaveLength(8);
  });

  it("requires listening evidence even when enough written answers are correct", () => {
    const questions = buildAssessmentQuestions("checkpoint", quizzes, "a1");
    const answers = Object.fromEntries(questions
      .filter((question) => question.type !== "listening")
      .map((question) => [question.id, question.answer]));
    questions.filter((question) => question.type === "listening").slice(0, 2)
      .forEach((question) => { answers[question.id] = question.answer; });
    const result = scoreAssessment(questions, answers, "checkpoint", "a1");

    expect(result.score).toBe(10);
    expect(result.listeningScore).toBe(2);
    expect(result.passed).toBe(false);
    expect(result.passedLevels).toEqual([]);
  });

  it("does not pass when listening answers are omitted", () => {
    const questions = buildAssessmentQuestions("checkpoint", quizzes, "a1");
    const answers = Object.fromEntries(questions
      .filter((question) => question.type !== "listening")
      .map((question) => [question.id, question.answer]));
    const result = scoreAssessment(questions, answers, "checkpoint", "a1");

    expect(result.listeningScore).toBe(0);
    expect(result.listeningTotal).toBe(6);
    expect(result.passed).toBe(false);
  });

  it("keeps answer keys and explanations out of the client projection", () => {
    const serverQuestions = buildAssessmentQuestions("checkpoint", quizzes, "a1");
    const clientQuestions = toClientAssessmentQuestions(serverQuestions);
    const publicListeningQuestion = clientQuestions.find((question) => question.audioSrc);

    expect(clientQuestions.map((question) => question.id)).toEqual(serverQuestions.map((question) => question.id));
    expect(publicListeningQuestion).toMatchObject({ audioSrc: "/listening/a1-listening-cafe.wav" });
    expect(publicListeningQuestion).not.toHaveProperty("answer");
    expect(publicListeningQuestion).not.toHaveProperty("explanation");
    const serialized = JSON.stringify(clientQuestions);
    expect(serialized).not.toContain("transcript");
    expect(allListeningItems().flatMap((item) => item.lines).every((line) => !serialized.includes(line.text))).toBe(true);
  });

  it("has three clips and a playable audio asset for every CEFR level", () => {
    expect(allListeningItems()).toHaveLength(18);
    for (const [level, clips] of Object.entries(LISTENING_BANK)) {
      expect(clips).toHaveLength(3);
      for (const clip of clips) {
        expect(clip.level).toBe(level);
        expect(clip.questions).toHaveLength(2);
        expect(existsSync(join(process.cwd(), "public", listeningAudioSrc(clip.id).slice(1)))).toBe(true);
      }
    }
  });

  it("keeps the evaluated level when a checkpoint is failed", () => {
    const questions = buildAssessmentQuestions("checkpoint", quizzes, "a1");
    const result = scoreAssessment(questions, {}, "checkpoint", "a1");

    expect(result.assignedLevel).toBe("A1");
    expect(result.passed).toBe(false);
    expect(result.needsReview).toHaveLength(8);
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
    const humbleButCorrect = scoreAssessment(questions, answers, "checkpoint", "a1", concepts, {
      "a1-verbo-to-be": "unknown",
    });

    expect(legacyResult.conceptSignals).toEqual([]);
    expect(conceptualResult.conceptSignals[0].status).toBe("mastered");
    expect(humbleButCorrect.conceptSignals[0].status).toBe("mastered");
    expect(humbleButCorrect.needsReview.some((topic) => topic.lessonSlug === "a1-verbo-to-be")).toBe(false);
  });

  it("does not put untested inventory ratings into needsReview after a scored quiz", () => {
    const questions = buildAssessmentQuestions("checkpoint", quizzes, "a1");
    const answers = Object.fromEntries(questions.map((question) => [question.id, question.answer]));
    const result = scoreAssessment(questions, answers, "placement", undefined, concepts, {
      "a1-verbo-to-be": "confident",
      "a1-presente-simple": "familiar",
      "a1-sin-preguntas": "unknown",
    });

    expect(result.total).toBeGreaterThan(0);
    expect(result.needsReview.map((topic) => topic.lessonSlug)).not.toContain("a1-sin-preguntas");
    expect(result.needsReview.every((topic) => result.topicScores.some(
      (score) => score.lessonSlug === topic.lessonSlug && score.correct < score.total,
    ))).toBe(true);
    expect(result.conceptSignals.find((signal) => signal.lessonSlug === "a1-sin-preguntas")?.status).toBe("learn");
  });

  it("uses inventory learn signals for needsReview only when no questions were answered", () => {
    const ratedConcepts = concepts.filter((concept) =>
      concept.lessonSlug === "a1-verbo-to-be" || concept.lessonSlug === "a1-sin-preguntas",
    );
    const result = scoreAssessment([], {}, "placement", undefined, ratedConcepts, {
      "a1-verbo-to-be": "unknown",
      "a1-sin-preguntas": "unknown",
    });

    expect(result.total).toBe(0);
    expect(result.needsReview.map((topic) => topic.lessonSlug).sort()).toEqual([
      "a1-sin-preguntas",
      "a1-verbo-to-be",
    ]);
  });

  it("groups placement questions by level for adaptive progression", () => {
    const questions = buildAssessmentQuestions("checkpoint", quizzes, "a1");
    const [section] = groupQuestionsByLevel(questions);
    const correct = Object.fromEntries(section.questions.map((question) => [question.id, question.answer]));

    expect(section.level).toBe("a1");
    expect(levelPassed("a1", section.questions, correct)).toBe(true);
    expect(levelPassed("a1", section.questions, {})).toBe(false);
  });

  it("builds server assessment with questions and concepts", () => {
    const { questions, concepts } = buildServerAssessment("placement");
    const rebuiltQuestions = buildServerAssessment("placement").questions;
    expect(questions.length).toBeGreaterThan(0);
    expect(concepts.length).toBeGreaterThan(0);
    expect(groupQuestionsByLevel(questions).map((section) => [section.level, section.questions.length]))
      .toEqual(["a1", "a2", "b1", "b2", "c1", "c2"].map((level) => [level, 14]));
    expect(questions.map((question) => [question.id, question.answer]))
      .toEqual(rebuiltQuestions.map((question) => [question.id, question.answer]));
  });
});

import { z } from "zod";
import type { CefrLevelId } from "@/lib/courses/types";

const ConceptSignalSchema = z.object({
  lessonSlug: z.string().trim().min(1).max(200),
  level: z.enum(["a1", "a2", "b1", "b2", "c1"] satisfies [CefrLevelId, ...CefrLevelId[]]),
  title: z.string().trim().min(1).max(200),
  selfRating: z.enum(["unknown", "familiar", "confident"]),
  status: z.enum(["mastered", "review", "learn"]),
  correct: z.number().int().min(0).max(100),
  total: z.number().int().min(0).max(100),
  assessedAt: z.iso.datetime({ offset: true }),
}).strict().refine((signal) => signal.correct <= signal.total, {
  message: "correct cannot exceed total",
  path: ["correct"],
});

export const AssessmentPayloadSchema = z.object({
  assignedLevel: z.enum(["A1", "A2", "B1", "B2", "C1"]),
  evaluatedLevels: z.array(z.enum(["a1", "a2", "b1", "b2", "c1"] satisfies [CefrLevelId, ...CefrLevelId[]])).max(5).optional(),
  confidence: z.enum(["low", "medium", "high"]).optional(),
  passed: z.boolean(),
  passedLevels: z.array(z.enum(["a1", "a2", "b1", "b2", "c1"] satisfies [CefrLevelId, ...CefrLevelId[]])).max(5),
  score: z.number().int().min(0),
  total: z.number().int().min(1).max(500),
  topicScores: z.array(z.object({
    lessonSlug: z.string().min(1).max(200),
    title: z.string().min(1).max(200),
    correct: z.number().int().min(0),
    total: z.number().int().min(1).max(100),
  }).strict()).max(100),
  strengths: z.array(z.object({
    lessonSlug: z.string().min(1).max(200),
    title: z.string().min(1).max(200),
  }).strict()).max(100),
  needsReview: z.array(z.object({
    lessonSlug: z.string().min(1).max(200),
    title: z.string().min(1).max(200),
  }).strict()).max(100),
  conceptSignals: z.array(ConceptSignalSchema).max(100),
}).strict();

export const AssessmentResultSchema = z.object({
  mode: z.enum(["placement", "checkpoint"]),
  evaluatedLevel: z.enum(["a1", "a2", "b1", "b2", "c1"] satisfies [CefrLevelId, ...CefrLevelId[]]).nullable().optional(),
  result: AssessmentPayloadSchema,
}).strict();

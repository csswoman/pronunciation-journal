import { z } from "zod";
import type { CefrLevelId } from "@/lib/courses/types";

const LEVEL_SCHEMA = z.enum(["a1", "a2", "b1", "b2", "c1", "c2"] satisfies [CefrLevelId, ...CefrLevelId[]]);
const LEVEL_ORDER: CefrLevelId[] = ["a1", "a2", "b1", "b2", "c1", "c2"];

const ConceptSignalSchema = z.object({
  lessonSlug: z.string().trim().min(1).max(200),
  level: LEVEL_SCHEMA,
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
  assignedLevel: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  evaluatedLevels: z.array(LEVEL_SCHEMA).max(6).optional(),
  confidence: z.enum(["low", "medium", "high"]).optional(),
  passed: z.boolean(),
  passedLevels: z.array(LEVEL_SCHEMA).max(6),
  score: z.number().int().min(0),
  total: z.number().int().min(0).max(500),
  listeningScore: z.number().int().min(0).max(36),
  listeningTotal: z.number().int().min(0).max(36),
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
}).strict().refine((result) => result.score <= result.total, {
  message: "score cannot exceed total",
  path: ["score"],
}).refine((result) => result.listeningScore <= result.listeningTotal, {
  message: "listeningScore cannot exceed listeningTotal",
  path: ["listeningScore"],
});

const AnswersSchema = z.record(z.string().min(1).max(120), z.number().int().min(0).max(10))
  .refine((answers) => Object.keys(answers).length <= 84, "Too many assessment answers");
const SelfRatingsSchema = z.record(z.string().min(1).max(200), z.enum(["unknown", "familiar", "confident"]));

function hasValidPlacementLevels(levels: CefrLevelId[] | undefined): boolean {
  if (!levels || levels.length === 0 || new Set(levels).size !== levels.length) return false;
  const indices = levels.map((level) => LEVEL_ORDER.indexOf(level));
  return indices.every((index, position) => position === 0 || index === indices[position - 1] + 1);
}

const AssessmentRequestFields = {
  mode: z.enum(["placement", "checkpoint"]),
  evaluatedLevels: z.array(LEVEL_SCHEMA).min(1).max(6).optional(),
  evaluatedLevel: LEVEL_SCHEMA.nullable().optional(),
  checkpointLevel: LEVEL_SCHEMA.nullable().optional(),
  answers: AnswersSchema.optional(),
  selfRatings: SelfRatingsSchema.optional(),
};

export const AssessmentScoreRequestSchema = z.object({
  mode: AssessmentRequestFields.mode,
  evaluatedLevels: AssessmentRequestFields.evaluatedLevels,
  checkpointLevel: LEVEL_SCHEMA.optional(),
  answers: AnswersSchema,
  selfRatings: SelfRatingsSchema.optional(),
}).strict().superRefine((body, context) => {
  if (body.mode === "checkpoint" && !body.checkpointLevel) {
    context.addIssue({ code: "custom", path: ["checkpointLevel"], message: "Checkpoint level required" });
  }
  if (body.mode === "placement" && !hasValidPlacementLevels(body.evaluatedLevels)) {
    context.addIssue({ code: "custom", path: ["evaluatedLevels"], message: "Placement levels must be a contiguous selection" });
  }
});

export const AssessmentResultSchema = z.object({
  ...AssessmentRequestFields,
  result: AssessmentPayloadSchema.optional(),
}).strict().superRefine((body, context) => {
  if (body.answers && body.mode === "placement") {
    if (body.evaluatedLevels && !hasValidPlacementLevels(body.evaluatedLevels)) {
      context.addIssue({ code: "custom", path: ["evaluatedLevels"], message: "Placement levels must be a contiguous selection" });
    } else if (!body.evaluatedLevels && !body.evaluatedLevel) {
      context.addIssue({ code: "custom", path: ["evaluatedLevels"], message: "Placement levels required" });
    }
  }
});

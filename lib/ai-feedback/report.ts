import { db, type AIFeedbackReportRecord } from "@/lib/db";
import { enqueue } from "@/lib/sync/sync-manager";
import { retractPracticeErrorRecurrence } from "@/lib/practice/error-recurrence-sync";
import type { ReportWrongFeedbackOptions, AIFeedbackReport } from "./types";

function truncateSnapshot(data: unknown, maxChars = 2000): unknown {
  if (typeof data === "string") {
    return data.length > maxChars ? data.slice(0, maxChars) : data;
  }
  try {
    const serialized = JSON.stringify(data);
    if (serialized.length <= maxChars) return data;
    return {
      truncated: true,
      raw: serialized.slice(0, maxChars),
    };
  } catch {
    return String(data).slice(0, maxChars);
  }
}

function sanitizeComment(comment?: string | null): string | null {
  if (!comment) return null;
  const trimmed = comment.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 300);
}

/**
 * Registra un reporte de corrección errónea de IA:
 * 1. Guarda el registro offline en Dexie (`aiFeedbackReports`).
 * 2. Encola la operación en el outbox (`ai_feedback_reports`).
 * 3. Si la corrección tenía `errorPattern` y pertenece a Coach o ejercicios,
 *    retira el fallo de la cola de reincidencia (`retractPracticeErrorRecurrence`).
 *    Para el Diario (`journal_correction`), el reporte se guarda pero no se
 *    retiran errores del lado del cliente.
 */
export async function reportWrongFeedback(
  options: ReportWrongFeedbackOptions,
): Promise<AIFeedbackReport> {
  const {
    userId,
    feature,
    promptVersion = "v1",
    input,
    output,
    errorPattern,
    comment,
  } = options;

  if (!userId.trim() || userId.toLowerCase() === "guest") {
    throw new Error("Reporting wrong feedback requires an authenticated user.");
  }

  const id =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `report_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const createdAtMs = Date.now();
  const createdAt = new Date(createdAtMs).toISOString();
  const inputSnapshot = truncateSnapshot(input, 2000);
  const outputSnapshot = truncateSnapshot(output, 2000);
  const cleanComment = sanitizeComment(comment);

  const reportRecord: AIFeedbackReportRecord = {
    id,
    userId,
    feature,
    promptVersion,
    inputSnapshot,
    outputSnapshot,
    errorPattern: errorPattern ?? null,
    comment: cleanComment,
    createdAt,
  };

  await db.transaction(
    "rw",
    [db.aiFeedbackReports, db.learningState, db.syncOutbox],
    async () => {
      await db.aiFeedbackReports.put(reportRecord);

      await enqueue(
        userId,
        "ai_feedback_reports",
        "insert",
        {
          id,
          user_id: userId,
          feature,
          prompt_version: promptVersion,
          input_snapshot: inputSnapshot,
          output_snapshot: outputSnapshot,
          error_pattern: errorPattern ?? null,
          comment: cleanComment,
          created_at: createdAt,
        },
        { id },
      );

      if (
        errorPattern &&
        (feature === "coach_correction" || feature === "production_grade")
      ) {
        await retractPracticeErrorRecurrence(userId, errorPattern, createdAtMs);
      }
    },
  );

  return {
    id,
    userId,
    feature,
    promptVersion,
    inputSnapshot,
    outputSnapshot,
    errorPattern: errorPattern ?? null,
    comment: cleanComment,
    createdAt,
  };
}

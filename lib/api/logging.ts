import { createHash } from "crypto";

type LogLevel = "error" | "warn";

type LogContext = {
  endpoint: string;
  operation?: string;
  userId?: string;
  status?: number;
};

function hashUserId(userId: string | undefined): string | undefined {
  if (!userId) return undefined;
  return createHash("sha256").update(userId).digest("hex").slice(0, 12);
}

function redactForLog(error: unknown): { type: string; message: string; status?: number } {
  if (error instanceof Error) {
    return { type: error.name, message: error.message };
  }
  if (error && typeof error === "object") {
    const maybe = error as { name?: unknown; message?: unknown; code?: unknown; status?: unknown; statusCode?: unknown };
    return {
      type: typeof maybe.name === "string" ? maybe.name : typeof maybe.code === "string" ? maybe.code : "Error",
      message: typeof maybe.message === "string" ? maybe.message : "Server error",
      status: typeof maybe.status === "number"
        ? maybe.status
        : typeof maybe.statusCode === "number"
          ? maybe.statusCode
          : undefined,
    };
  }
  return { type: "Error", message: String(error) };
}

function shouldEmitLogs(): boolean {
  // Opt-in escape hatch when debugging API failure paths locally.
  if (process.env.DEBUG_API_LOGS === "1") return true;
  // Route tests intentionally hit Zod/provider failures; keep suite output clean.
  if (process.env.VITEST === "true") return false;
  return true;
}

export function logServerError(
  message: string,
  error: unknown,
  context: LogContext,
  level: LogLevel = "error"
): void {
  if (!shouldEmitLogs()) return;

  const payload = {
    endpoint: context.endpoint,
    operation: context.operation,
    status: context.status,
    user: hashUserId(context.userId),
    error: redactForLog(error),
  };

  if (level === "warn") {
    console.warn(message, payload);
    return;
  }

  console.error(message, payload);
}

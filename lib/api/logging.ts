import { createHash } from "crypto";

export type LogLevel = "error" | "warn";

export type LogContext = {
  endpoint: string;
  operation?: string;
  userId?: string;
  status?: number;
};

export interface RedactedError {
  type: string;
  message: string;
  status?: number;
}

const BASE64_PATTERN = /[A-Za-z0-9+/]{30,}={0,2}/g;
const GOOGLE_API_KEY_PATTERN = /AIza[0-9A-Za-z_-]{20,}/g;
const JWT_PATTERN = /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/g;
const OPENAI_KEY_PATTERN = /sk-[A-Za-z0-9_-]{20,}/g;
const BEARER_PATTERN = /Bearer\s+[A-Za-z0-9._-]+/gi;
const EMAIL_PATTERN = /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g;
const UUID_PATTERN =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi;
const SENSITIVE_KEY_VALUE_PATTERN =
  /\b(?:prompt|systemInstruction|transcript|transcription|audio|password|token|secret|apiKey|api_key|serviceRoleKey|authorization)\b\s*[:=]\s*(?:"[^"]*"|'[^']*'|`[^`]*`|\{[^}]*\}|\[[^\]]*\]|[^\s,;]+)/gi;

const MAX_LOG_MESSAGE_LENGTH = 180;

export function hashUserId(userId: string | undefined): string | undefined {
  if (!userId) return undefined;
  return createHash("sha256").update(userId).digest("hex").slice(0, 12);
}

/**
 * Single centralized error redactor for all server-side logging.
 * Strips base64 payloads, API keys, tokens, emails, prompt texts, audio, and transcripts,
 * truncating messages to a safe length and preserving only technical context.
 */
export function redactForLog(error: unknown): RedactedError {
  if (!error || (typeof error !== "object" && typeof error !== "string")) {
    return { type: "UnknownError", message: "Server error" };
  }

  let type = "Error";
  let rawMessage = "";
  let status: number | undefined;

  if (error instanceof Error) {
    type = error.name || "Error";
    rawMessage = error.message;
    if ("status" in error && typeof (error as { status?: unknown }).status === "number") {
      status = (error as { status: number }).status;
    } else if ("statusCode" in error && typeof (error as { statusCode?: unknown }).statusCode === "number") {
      status = (error as { statusCode: number }).statusCode;
    }
  } else if (typeof error === "object") {
    const obj = error as Record<string, unknown>;
    type = typeof obj.name === "string" ? obj.name : typeof obj.code === "string" ? obj.code : "Error";
    rawMessage = typeof obj.message === "string" ? obj.message : JSON.stringify(error);
    if (typeof obj.status === "number") status = obj.status;
    else if (typeof obj.statusCode === "number") status = obj.statusCode;
  } else {
    rawMessage = String(error);
  }

  const safeMessage = rawMessage
    .replace(GOOGLE_API_KEY_PATTERN, "[redacted-api-key]")
    .replace(JWT_PATTERN, "[redacted-jwt]")
    .replace(OPENAI_KEY_PATTERN, "[redacted-key]")
    .replace(BEARER_PATTERN, "Bearer [redacted-token]")
    .replace(EMAIL_PATTERN, "[redacted-email]")
    .replace(UUID_PATTERN, "[redacted-id]")
    .replace(SENSITIVE_KEY_VALUE_PATTERN, "[redacted-content]")
    .replace(BASE64_PATTERN, "[redacted-base64]")
    .slice(0, MAX_LOG_MESSAGE_LENGTH);

  return {
    type,
    message: safeMessage || "Server error",
    ...(status !== undefined ? { status } : {}),
  };
}

function shouldEmitLogs(): boolean {
  if (process.env.DEBUG_API_LOGS === "1") return true;
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

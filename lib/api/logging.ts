import { createHash } from "crypto";
import { redactError } from "@/lib/api/guards";

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

export function logServerError(
  message: string,
  error: unknown,
  context: LogContext,
  level: LogLevel = "error"
): void {
  const payload = {
    endpoint: context.endpoint,
    operation: context.operation,
    status: context.status,
    user: hashUserId(context.userId),
    error: redactError(error),
  };

  if (level === "warn") {
    console.warn(message, payload);
    return;
  }

  console.error(message, payload);
}

import { db } from "@/lib/db";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { SyncOutboxEntry } from "./types";

declare global {
  interface Window {
    __syncRecovery?: {
      recoverResolvedSchemaFailures: () => Promise<SchemaFailureRecoveryResult>;
      getUncodedFailedBundleGap: () => Promise<UncodedFailedBundleGap>;
    };
  }
}

/** Only codes whose concrete schema repair ships in this client may be retried. */
export const RESOLVED_SCHEMA_ERROR_CODES = new Set(["PGRST204"]);
export const DEFAULT_SCHEMA_RECOVERY_BUNDLE_LIMIT = 10;

type FailedBundle = {
  key: string;
  entries: SyncOutboxEntry[];
  failedAt: string;
};

export interface UncodedFailedBundleGap {
  count: number;
  oldestFailedAt?: string;
  newestFailedAt?: string;
}

export interface RecoverResolvedSchemaFailureOptions {
  maxBundles?: number;
  /** Injectable so callers/tests can verify the repaired remote schema. */
  verifyResolved?: () => Promise<boolean>;
}

export interface SchemaFailureRecoveryResult {
  requeuedBundles: number;
  requeuedEntries: number;
  schemaResolved: boolean;
  uncodedGap: UncodedFailedBundleGap;
}

function bundleKey(entry: SyncOutboxEntry): string {
  return entry.bundleId ?? `entry:${entry.id}`;
}

function failedAt(entries: SyncOutboxEntry[]): string {
  return entries.reduce((latest, entry) => {
    const value = entry.lastAttemptAt ?? entry.createdAt;
    return value > latest ? value : latest;
  }, "");
}

function failedBundles(entries: SyncOutboxEntry[]): FailedBundle[] {
  const byBundle = new Map<string, SyncOutboxEntry[]>();
  for (const entry of entries.filter((entry) => entry.status === "failed")) {
    const key = bundleKey(entry);
    const current = byBundle.get(key) ?? [];
    current.push(entry);
    byBundle.set(key, current);
  }
  return [...byBundle.entries()].map(([key, bundleEntries]) => ({
    key,
    entries: bundleEntries,
    failedAt: failedAt(bundleEntries),
  }));
}

function uncodedGap(bundles: FailedBundle[]): UncodedFailedBundleGap {
  const uncoded = bundles.filter((bundle) => bundle.entries.some((entry) => !entry.errorCode));
  const dates = uncoded.map((bundle) => bundle.failedAt).filter(Boolean).sort();
  return {
    count: uncoded.length,
    ...(dates[0] ? { oldestFailedAt: dates[0] } : {}),
    ...(dates.at(-1) ? { newestFailedAt: dates.at(-1) } : {}),
  };
}

/**
 * Cheap positive check for the only schema repair currently eligible for recovery.
 * Any response error leaves the bundle terminal rather than guessing from text.
 */
export async function isRenderedModeSchemaAvailable(): Promise<boolean> {
  const supabase = getSupabaseBrowserClient();
  // Generated browser types intentionally lag the skill-model tables.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase.from("attempt_logs" as any)
    .select("rendered_mode")
    .limit(1);
  return !error;
}

/** Local, explicit recovery; callers decide when to invoke it. */
export async function recoverResolvedSchemaFailures(
  userId: string,
  options: RecoverResolvedSchemaFailureOptions = {},
): Promise<SchemaFailureRecoveryResult> {
  const entries = await db.syncOutbox.where("userId").equals(userId).toArray();
  const bundles = failedBundles(entries);
  const gap = uncodedGap(bundles);
  const eligible = bundles
    .filter((bundle) => bundle.entries.every((entry) =>
      Boolean(entry.errorCode) && RESOLVED_SCHEMA_ERROR_CODES.has(entry.errorCode!)))
    .sort((left, right) => left.failedAt.localeCompare(right.failedAt))
    .slice(0, options.maxBundles ?? DEFAULT_SCHEMA_RECOVERY_BUNDLE_LIMIT);

  if (eligible.length === 0) {
    return { requeuedBundles: 0, requeuedEntries: 0, schemaResolved: false, uncodedGap: gap };
  }
  const schemaResolved = await (options.verifyResolved ?? isRenderedModeSchemaAvailable)();
  if (!schemaResolved) {
    return { requeuedBundles: 0, requeuedEntries: 0, schemaResolved: false, uncodedGap: gap };
  }

  const ids = eligible.flatMap((bundle) => bundle.entries.map((entry) => entry.id!));
  await db.syncOutbox.where("id").anyOf(ids).modify({
    status: "pending",
    retryCount: 0,
    nextRetryAt: undefined,
    errorMessage: undefined,
    errorCode: undefined,
    errorDetails: undefined,
    errorHint: undefined,
  });
  return {
    requeuedBundles: eligible.length,
    requeuedEntries: ids.length,
    schemaResolved: true,
    uncodedGap: gap,
  };
}

/** Consultable local audit for historical failures that cannot be recovered safely. */
export async function getUncodedFailedBundleGap(userId: string): Promise<UncodedFailedBundleGap> {
  const entries = await db.syncOutbox.where("userId").equals(userId).toArray();
  return uncodedGap(failedBundles(entries));
}

/** Development-console entry point; installs commands but never runs recovery. */
export function exposeSyncRecoveryDevTools(userId: string): void {
  if (process.env.NODE_ENV !== "development" || typeof window === "undefined") return;
  window.__syncRecovery = {
    recoverResolvedSchemaFailures: () => recoverResolvedSchemaFailures(userId),
    getUncodedFailedBundleGap: () => getUncodedFailedBundleGap(userId),
  };
}

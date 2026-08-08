import type { SyncOperationOutcome, SyncOutboxEntry, SyncTable } from "./types";

const SYNC_PHASE: Partial<Record<SyncTable, number>> = {
  learning_items: 0,
  attempt_logs: 1,
  srs_review_events: 2,
};

export type RemoteEntryResult =
  | { synced: true }
  | {
      synced: false;
      message: string;
      permanent: boolean;
      retryCount: number;
      attemptedAt: string;
      nextRetryAt?: string;
    };

interface SkillModelHandlerDependencies {
  attempt(entry: SyncOutboxEntry): Promise<RemoteEntryResult>;
  recordFailure(
    entry: SyncOutboxEntry,
    result: Extract<RemoteEntryResult, { synced: false }>,
  ): Promise<unknown>;
  update(id: number, changes: Partial<SyncOutboxEntry>): Promise<unknown>;
  remove(id: number): Promise<unknown>;
  operations: SyncOperationOutcome[];
}

export function isSkillModelEntry(entry: SyncOutboxEntry): boolean {
  return SYNC_PHASE[entry.table] !== undefined;
}

export function remoteFailureChanges(
  result: Extract<RemoteEntryResult, { synced: false }>,
): Partial<SyncOutboxEntry> {
  return {
    status: result.permanent ? "failed" : "pending",
    retryCount: result.retryCount,
    errorMessage: result.message,
    lastAttemptAt: result.attemptedAt,
    nextRetryAt: result.nextRetryAt,
  };
}

/** Keep bundles account-scoped even if two clients generate the same ID. */
export function buildSkillModelBundles(
  entries: SyncOutboxEntry[],
): Map<string, SyncOutboxEntry[]> {
  const bundles = new Map<string, SyncOutboxEntry[]>();
  for (const entry of entries) {
    const payload = entry.payload as Record<string, unknown>;
    const inferredBundleId = entry.table === "attempt_logs"
      ? payload.id
      : entry.table === "srs_review_events"
        ? payload.attempt_log_id
        : undefined;
    const bundleId = entry.bundleId
      ?? (typeof inferredBundleId === "string" ? inferredBundleId : `entry:${entry.id}`);
    const key = `${entry.userId}:${bundleId}`;
    const bundle = bundles.get(key);
    if (bundle) bundle.push(entry);
    else bundles.set(key, [entry]);
  }
  return bundles;
}

/**
 * Sends one atomic local bundle in parent-before-child phases. Nothing is
 * removed from the outbox until the whole bundle succeeds remotely.
 */
export async function processSkillModelBundle(
  entries: SyncOutboxEntry[],
  dependencies: SkillModelHandlerDependencies,
): Promise<void> {
  const { attempt, recordFailure, update, remove, operations } = dependencies;
  const failures: Array<{
    entry: SyncOutboxEntry;
    result: Extract<RemoteEntryResult, { synced: false }>;
  }> = [];
  const attemptedIds = new Set<number>();

  for (const phase of [0, 1, 2]) {
    const phaseEntries = entries.filter((entry) => SYNC_PHASE[entry.table] === phase);
    const results = await Promise.all(
      phaseEntries.map(async (entry) => ({ entry, result: await attempt(entry) })),
    );

    for (const { entry, result } of results) {
      attemptedIds.add(entry.id!);
      if (result.synced) {
        operations.push({
          id: entry.id!, table: entry.table, operation: entry.operation, outcome: "synced",
        });
      } else {
        failures.push({ entry, result });
        await recordFailure(entry, result);
        operations.push({
          id: entry.id!,
          table: entry.table,
          operation: entry.operation,
          outcome: "failed",
          errorMessage: result.message,
        });
      }
    }

    if (failures.length > 0) break;
  }

  if (failures.length === 0) {
    await Promise.all(entries.map((entry) => remove(entry.id!)));
    return;
  }

  const permanent = failures.some(({ result }) => result.permanent);
  const firstFailure = failures[0].result;
  const retainedMessage = `Skill-model bundle retained after: ${firstFailure.message}`;
  const failedIds = new Set(failures.map(({ entry }) => entry.id!));

  for (const entry of entries.filter((candidate) => !failedIds.has(candidate.id!))) {
    await update(entry.id!, {
      status: permanent ? "failed" : "pending",
      errorMessage: retainedMessage,
      lastAttemptAt: firstFailure.attemptedAt,
      nextRetryAt: permanent ? undefined : firstFailure.nextRetryAt,
    });
    if (!attemptedIds.has(entry.id!)) {
      operations.push({
        id: entry.id!,
        table: entry.table,
        operation: entry.operation,
        outcome: "skipped",
        errorMessage: retainedMessage,
      });
    }
  }
}

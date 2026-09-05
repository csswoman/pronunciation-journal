import Dexie, { type Table } from "dexie";
import type { AIConversation, AISavedWord, Attempt, DailyProgress, FavoriteWord, SRSData, UserStats } from "../types";
import type { SyncOutboxEntry } from "../sync/types";
import type { UserLearningState } from "../ai-practice/learning-state";
import type { GenericExercise, GenericExerciseType, ExerciseSource } from "../exercises/types";
import type { ExerciseResult, PracticeExercise } from "../practice/types";
import type { ReaderPassage } from "../practice/reader/types";
import type {
  AttemptLog,
  LearningItem,
  SrsReviewEvent,
} from "../essential-words/verification/types";
import { getRelativeLocalDateKey, getTodayLocalDateKey } from "../date/local-date";
import { migrateArchivedRow } from "../srs/migrate-archived";
import { patchActivateNow, patchMaster, patchSnooze } from "../srs/status";
import type { JournalEntryRecord } from '../journal/types';
import type { TrackingReviewQueue } from '../tracking/review-queue';
import type { ScriptedMission } from '../ai-practice/missions/types';
import type { GrammarStudyDeckData } from '../courses/grammar-deck/types';

export interface GeneratedScriptRecord {
  id: string;
  userId: string;
  /** La misión completa, lista para ejecutar sin volver a llamar a la API. */
  mission: ScriptedMission;
  /** Tema que pidió el usuario, para poder buscarlo después. */
  topic: string;
  createdAt: string;
}


/**
 * Active in-progress practice session, persisted so the user can resume
 * after closing the tab, opening a new window, or losing offline state.
 * One row per (userId, soundId) — composite key `${userId}:${soundId}`.
 */
export interface PracticeSessionRecord {
  id: string;          // `${userId}:${soundId}`
  soundId: number;
  userId: string;
  exercises: PracticeExercise[];
  currentIndex: number;
  answers: ExerciseResult[];
  startedAt: string;   // ISO
  expiresAt: string;   // ISO — used to evict 24h+ stale sessions
}

export interface CachedExercise {
  /** Same deterministic id as GenericExercise.id. */
  id: string
  type: GenericExerciseType
  source: ExerciseSource
  /** ISO timestamp — used to invalidate stale cache entries. */
  generatedAt: string
  exercise: GenericExercise
}

interface StoredLearningState {
  userId: string; // PK
  state: UserLearningState;
  updatedAt: string;
  syncedAt?: string;
}

export type AnalyticsEventName =
  | "exercise_shown"
  | "exercise_answered"
  | "exercise_correct"
  | "next_clicked"
  | "retry_clicked"
  | "exercise_abandoned"
  | "auto_next_triggered"
  | "time_to_first_exercise"
  | "session_started"
  | "session_ended";

export interface AnalyticsEvent {
  id?: number;
  userId: string;
  name: AnalyticsEventName;
  payload: Record<string, unknown>;
  timestamp: string;
  synced: 0 | 1;
}

interface LessonSessionOffset {
  userId?: string;
  lessonId: string; // PK
  offset: number;   // next starting index
}

export interface CompletedCourseLesson {
  // PK: `${userId}:${courseSlug}:${lessonSlug}`
  key: string;
  userId: string;
  courseSlug: string;
  lessonSlug: string;
  completedAt: string; // ISO
  source?: string;
  updatedAt: string; // ISO
}

export interface IpaExplorationRecord {
  userId?: string;
  // PK: `${date}:${symbol}` — one row per phoneme explored per day
  key: string;
  date: string;   // YYYY-MM-DD
  symbol: string; // e.g. "/iː/"
  exploredAt: string; // ISO
}

/** Key/value store for lightweight practice UI prefs (e.g. last mode used). */
export interface PracticePrefRecord {
  key: string;   // PK, e.g. "lastPracticeMode"
  value: string;
  updatedAt: string; // ISO
}

export interface PronunciationMasteryRecord {
  userId: string;
  phrase: string;
  masteredAt: string;
  migratedFromLocalStorage?: 0 | 1;
}

export interface PronunciationCoachStateRecord {
  userId: string;
  key: "queue" | "seen";
  values: string[];
  updatedAt: string;
  migratedFromLocalStorage?: 0 | 1;
}

/** Legacy private rows whose account cannot be proven during a Dexie upgrade.
 * They are deliberately non-rendered and retained only for manual recovery. */
export interface LocalDataQuarantineRecord {
  id?: number;
  store: string;
  legacyKey: string;
  payload: Record<string, unknown>;
  quarantinedAt: string;
  reason: "ambiguous-owner";
}

export interface TrackedItemRecord {
  id: string;
  userId: string;
  kind: "phrase" | "lesson";
  ref: string;
  title: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface TrackingReviewSessionRecord {
  id: string;
  userId: string;
  queue: TrackingReviewQueue;
  createdAt: string;
  expiresAt: string;
}

/**
 * Local mirror of a completed pronunciation diagnostic (plan 067 step 6).
 *
 * Written offline-first alongside the outbox enqueue so a diagnostic
 * completed offline survives a page refresh before it syncs. `id` is the
 * same client-generated uuid used as the row's Supabase primary key — it
 * doubles as this table's idempotency marker: once `syncedAt` is set, the
 * enqueue helper skips re-enqueueing this id (see
 * `lib/pronunciation/assessment/persistence.ts`), since a plain `insert`
 * outbox entry (unlike the SRS 'rpc' entries) has no server-side
 * ON CONFLICT DO NOTHING to absorb a duplicate retry.
 */
export interface PronunciationAssessmentRecord {
  id: string;
  userId: string;
  schemaVersion: number;
  result: Record<string, unknown>;
  completedAt: string; // ISO
  createdAt: string; // ISO
  syncedAt?: string; // ISO — set once the outbox entry for this id has synced
}

export interface PronunciationFeedbackEvidenceRecord {
  id: string; userId: string; targetId: string; evaluatorKind: 'stt_intelligibility' | 'transcript_phoneme_inference';
  evaluatorVersion: string; outcome: 'improved' | 'same' | 'needs_more_evidence' | 'unscored';
  attemptPairId?: string; occurredAt: string; createdAt: string;
}

export interface MissionSessionRecord {
  id: string;
  userId: string;
  missionId: string;
  targetIds: string[];
  launchSource?: string;
  sourceStepId?: string;
  outcome: Record<string, unknown>;
  turnCount: number;
  status: 'in_progress' | 'completed' | 'cancelled' | 'provider_error';
  startedAt: string;
  completedAt: string | null;
}

/**
 * Local mirror of a word_bank/topic_srs SM-2 materialized row (plan 061 step 2).
 *
 * Lets grading UI compute+display the next SM-2 state OPTIMISTICALLY without a
 * network read: `enqueueWordBankSRSUpdate`/`enqueueTopicSRSUpdate` (rewritten
 * in step 3) read this instead of Supabase before writing a
 * SRSRatingEventRecord + updating this row's mirror in one Dexie transaction.
 *
 * The server-side RPC (apply_word_bank_rating_event / apply_topic_srs_rating_event)
 * remains the source of truth — this is a display/offline-compute cache, kept
 * in sync by the sync flusher applying confirmed RPC results (step 3+).
 */
export interface SRSEntityStateRecord {
  // PK: `${userId}:word_bank:${wordId}` or `${userId}:topic_srs:${normalizedTopic}`
  id: string;
  userId: string;
  entityType: "word_bank" | "topic_srs";
  /** word_bank: the word_bank.id row. topic_srs: undefined (keyed by topic instead). */
  entityId?: string;
  /** topic_srs: the normalized topic string (its natural key). word_bank: undefined. */
  topic?: string;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReviewAt: string | null;
  srsStatus: "new" | "learning" | "review" | "mastered";
  reviewCount: number;
  lastReviewedAt: string | null;
  updatedAt: string; // ISO — last time this mirror was written locally
}

/**
 * One immutable rating submission, mirrored locally so it can be enqueued to
 * the outbox and replayed against `apply_word_bank_rating_event` /
 * `apply_topic_srs_rating_event` without a network read (plan 061 step 2).
 *
 * `id` doubles as the RPC's idempotency key (`p_idempotency_key`) — generate
 * with crypto.randomUUID() at creation time, never regenerate on retry.
 */
export interface SRSRatingEventRecord {
  /** Idempotency key — PK. Passed verbatim as p_idempotency_key to the RPC. */
  id: string;
  userId: string;
  entityType: "word_bank" | "topic_srs" | "essential_words";
  /** word_bank: required. topic_srs: undefined. essential_words: c1k: wordId. */
  entityId?: string;
  /** topic_srs: required (natural key; the row may not exist yet). word_bank / essential_words: undefined. */
  topic?: string;
  grade: number;
  occurredAt: string; // ISO
  evaluatorMetadata?: Record<string, unknown>;
  /** Local submission bookkeeping — separate from the outbox's own status. */
  status: "pending" | "applied";
  createdAt: string; // ISO

  // Essential Words review fields. Optional so existing word_bank/topic_srs
  // rows and their readers remain unchanged.
  stability?: number;
  difficulty?: number;
  elapsedDays?: number;
  state?: "new" | "learning" | "review" | "relearning";
  hintsUsed?: number;
  latencyMs?: number;
  isRepair?: boolean;
}

/** Pre-graduation intermediate state for one Essential Words word. */
export interface EssentialWordProgressRecord {
  /** Primary key: `${userId}:${wordId}`. */
  id: string;
  wordId: string;
  userId: string;
  exposedAt: string;
  highestLevel: 0 | 1 | 2 | 3;
  lastLevelAt: string;
  lastSessionId: string;
  attempts: number;
}

/** Device-local, account-scoped snapshot of an unfinished Essential Words session. */
export interface EssentialWordSessionDraftRecord {
  /** One active draft per account. */
  userId: string;
  version: 1;
  sessionId: string;
  source: "legacy" | "skill";
  sizeId: "short" | "recommended" | "long";
  routeId: string | null;
  levels: string[] | null;
  pos: string[] | null;
  plan: unknown;
  results: unknown[];
  progress: unknown[];
  summary: { practiced: number; correct: number } | null;
  activeElapsedMs: number;
  createdAt: string;
  updatedAt: string;
}

/** Indexed local projection of one schedulable Essential Words skill. */
export type LearningItemRecord = LearningItem & {
  userId: string;
  /** Indexed mirror of schedule.dueAt, omitted for unscheduled items. */
  dueAt?: string;
  /** Indexed mirror of schedule.kind. */
  scheduleKind: LearningItem["schedule"]["kind"];
  updatedAt: string;
};

/** Immutable local log of one pedagogical interaction. */
export interface AttemptLogRecord extends AttemptLog {
  userId: string;
  synced: boolean;
}

/** Immutable SRS effect for exactly one learning item. */
export interface SrsReviewEventRecord extends SrsReviewEvent {
  userId: string;
  synced: boolean;
}

/** Local cache of reference sounds for offline phoneme practice (Plan 080). */
export interface CachedSoundRecord {
  id: number;
  ipa: string;
  example: string | null;
  category: string | null;
  type: string | null;
  difficulty: number | null;
}

/** Local offline cache of contrast progress for phoneme practice (Plan 080). */
export interface CachedContrastProgressRecord {
  key: string; // `${userId}:${contrastId}`
  id?: string;
  userId: string;
  contrastId: string;
  easeFactor: number;
  intervalDays: number;
  nextReview: string | null;
  lastSeen: string | null;
  totalAttempts: number;
  correctAnswers: number;
  streak: number;
  masteryPct: number;
  adaptiveScore?: number;
  observationCount?: number;
  updatedAt: string;
}

export interface DownloadedLessonRecord {
  id: string; // `${trackId}:${lessonNumber}`
  trackId: string;
  lessonNumber: number;
  slug?: string;
  title: string;
  deck: GrammarStudyDeckData;
  audioUrls: string[];
  downloadedAt: string; // ISO
}

class PronunciationDB extends Dexie {
  attempts!: Table<Attempt, number>;
  srsData!: Table<SRSData, string>;
  dailyProgress!: Table<DailyProgress, number>;
  userStats!: Table<UserStats, number>;
  favorites!: Table<FavoriteWord, number>;
  aiConversations!: Table<AIConversation, number>;
  aiWords!: Table<AISavedWord, number>;
  lessonOffsets!: Table<LessonSessionOffset, string>;
  syncOutbox!: Table<SyncOutboxEntry, number>;
  completedLessons!: Table<CompletedCourseLesson, string>;
  learningState!: Table<StoredLearningState, string>;
  analyticsEvents!: Table<AnalyticsEvent, number>;
  generatedExercises!: Table<CachedExercise, string>;
  practiceSessions!: Table<PracticeSessionRecord, string>;
  ipaExplorations!: Table<IpaExplorationRecord, string>;
  readerPassages!: Table<ReaderPassage, string>;
  practicePrefs!: Table<PracticePrefRecord, string>;
  pronunciationMastery!: Table<PronunciationMasteryRecord, string>;
  pronunciationCoachState!: Table<PronunciationCoachStateRecord, string>;
  journalEntries!: Table<JournalEntryRecord, string>;
  trackedItems!: Table<TrackedItemRecord, string>;
  trackingReviewSessions!: Table<TrackingReviewSessionRecord, string>;
  localDataQuarantine!: Table<LocalDataQuarantineRecord, number>;
  srsEntityState!: Table<SRSEntityStateRecord, string>;
  srsRatingEvents!: Table<SRSRatingEventRecord, string>;
  essentialWordProgress!: Table<EssentialWordProgressRecord, string>;
  essentialWordSessionDrafts!: Table<EssentialWordSessionDraftRecord, string>;
  pronunciationAssessments!: Table<PronunciationAssessmentRecord, string>;
  pronunciationFeedbackEvidence!: Table<PronunciationFeedbackEvidenceRecord, string>;
  missionSessions!: Table<MissionSessionRecord, string>;
  learningItems!: Table<LearningItemRecord, string>;
  attemptLogs!: Table<AttemptLogRecord, string>;
  srsReviewEvents!: Table<SrsReviewEventRecord, string>;
  generatedScripts!: Table<GeneratedScriptRecord, string>;
  cachedSounds!: Table<CachedSoundRecord, number>;
  cachedContrastProgress!: Table<CachedContrastProgressRecord, string>;
  downloadedLessons!: Table<DownloadedLessonRecord, string>;


  constructor() {
    super("pronunciation-journal");

    // Dexie merges schemas forward: each version() lists ONLY the stores that
    // change relative to the previous version. Read top-to-bottom for the
    // schema's history. The effective schema is the union of all blocks.

    // v1: initial schema
    this.version(1).stores({
      attempts:      "++id, word, lessonId, timestamp",
      srsData:       "wordId, word, nextReview",
      dailyProgress: "++id, date",
      userStats:     "++id",
    });

    // v2: favorite words
    this.version(2).stores({
      favorites: "++id, word, lessonId, addedAt",
    });

    // v3: AI conversations + saved words
    this.version(3).stores({
      aiConversations: "++id, templateId, createdAt, updatedAt",
      aiWords:         "++id, word, conversationId, savedAt, difficulty",
    });

    // v4: lesson session offsets
    this.version(4).stores({
      lessonOffsets: "lessonId",
    });

    // v5: offline-first sync queue (Outbox Pattern).
    // Indexed by status+createdAt to efficiently query pending entries in order
    this.version(5).stores({
      syncOutbox: "++id, status, createdAt, [status+createdAt]",
    });

    // v6: legacy stores — never used; kept so Dexie doesn't break existing DBs on upgrade.
    // user_sound_progress was dropped (migration 20260602100000_contrast_progress.sql).
    // answer_history now goes through the syncOutbox (v5). Do not write to these.
    this.version(6).stores({
      localSoundProgress: "localKey, userId, soundId, nextReview",
      localAnswerHistory: "++id, userId, soundId, answeredAt, synced",
    });

    // v7: course lesson completion tracking (offline-first)
    this.version(7).stores({
      completedLessons: "key, courseSlug, completedAt",
    });

    // v8: mode index on aiConversations + learningState store
    this.version(8).stores({
      aiConversations: "++id, templateId, mode, createdAt, updatedAt",
      learningState:   "userId, updatedAt",
    });

    // v9: analytics events (local + optional Supabase batch sync)
    this.version(9).stores({
      analyticsEvents: "++id, name, timestamp, synced",
    });

    // v10: generic exercise cache (fill_blank, sentence_dictation, match_pairs, reorder_words)
    this.version(10).stores({
      generatedExercises: "id, type, source, generatedAt",
    });

    // v11: active in-progress practice sessions for resume-on-reload
    this.version(11).stores({
      practiceSessions: "id, userId, soundId, expiresAt",
    });

    // v12: per-day IPA phoneme exploration tracking
    this.version(12).stores({
      ipaExplorations: "key, date, symbol",
    });

    // v13: reader passages (comprehensible-input reader, offline reread cache)
    this.version(13).stores({
      readerPassages: "id, userId, targetHash, createdAt",
    });

    // v14: lightweight key/value prefs for the practice hub (last mode used)
    this.version(14).stores({
      practicePrefs: "key",
    });

    // v15: durable pronunciation coach mastery state.
    this.version(15).stores({
      pronunciationMastery: "phrase, masteredAt",
    });

    // v16: durable pronunciation coach queue/seen state.
    this.version(16).stores({
      pronunciationCoachState: "key, updatedAt",
    });
    this.version(17).stores({ journalEntries: 'id, userId, entryDate, status, updatedAt' });
    this.version(18).stores({ journalEntries: 'id, userId, entryDate, [userId+entryDate], status, updatedAt' });
    this.version(19).stores({ trackedItems: 'id, userId, kind, ref, [userId+kind], [userId+kind+ref], createdAt, updatedAt' });
    this.version(20).stores({ completedLessons: 'key, userId, courseSlug, lessonSlug, [userId+courseSlug], [userId+courseSlug+lessonSlug], completedAt, updatedAt' });
    // v21: account namespace for every private local mirror. Existing rows
    // without a provable owner are quarantined rather than exposed to whoever
    // signs in next. Device-global caches/preferences remain unchanged.
    this.version(21).stores({
      attempts: '++id, userId, [userId+timestamp], [userId+lessonId]',
      srsData: 'wordId, userId, [userId+wordId], [userId+nextReview]',
      dailyProgress: '++id, userId, [userId+date]',
      userStats: '++id, userId',
      favorites: '++id, userId, [userId+word]',
      aiConversations: '++id, userId, [userId+mode], [userId+updatedAt]',
      aiWords: '++id, userId, [userId+savedAt], [userId+conversationId]',
      lessonOffsets: 'lessonId, userId, [userId+lessonId]',
      syncOutbox: '++id, userId, status, createdAt, [status+createdAt], [userId+status+createdAt]',
      ipaExplorations: 'key, userId, [userId+date]',
      // IndexedDB cannot change an existing object store's primary key during
      // an upgrade. Keep the legacy primary keys here; v25 creates replacement
      // stores with account-scoped compound keys below.
      pronunciationMastery: 'phrase, userId, masteredAt',
      pronunciationCoachState: 'key, userId, updatedAt',
      localDataQuarantine: '++id, store, quarantinedAt',
    }).upgrade(async (tx) => {
      const ambiguousStores = [
        'attempts', 'srsData', 'dailyProgress', 'userStats', 'favorites',
        'aiConversations', 'aiWords', 'lessonOffsets', 'ipaExplorations',
        'pronunciationMastery', 'pronunciationCoachState',
      ];
      const quarantine = tx.table('localDataQuarantine');
      for (const storeName of ambiguousStores) {
        const store = tx.table(storeName);
        const rows = await store.toArray();
        if (rows.length) {
          await quarantine.bulkAdd(rows.map((row, index) => ({
            store: storeName,
            legacyKey: String((row as { id?: unknown; key?: unknown; wordId?: unknown; phrase?: unknown }).id
              ?? (row as { key?: unknown }).key
              ?? (row as { wordId?: unknown }).wordId
              ?? (row as { phrase?: unknown }).phrase
              ?? index),
            payload: row as Record<string, unknown>,
            quarantinedAt: new Date().toISOString(),
            reason: 'ambiguous-owner' as const,
          })));
          await store.clear();
        }
      }
      const outbox = tx.table('syncOutbox');
      const entries = await outbox.toArray() as Array<Record<string, unknown>>;
      for (const entry of entries) {
        const payload = (entry.payload ?? {}) as Record<string, unknown>;
        const matchKey = (entry.matchKey ?? {}) as Record<string, unknown>;
        const userId = entry.userId ?? payload.user_id ?? payload.userId ?? matchKey.user_id ?? matchKey.userId;
        if (typeof userId === 'string' && userId) await outbox.update(entry.id as number, { userId });
        else {
          await quarantine.add({ store: 'syncOutbox', legacyKey: String(entry.id), payload: entry, quarantinedAt: new Date().toISOString(), reason: 'ambiguous-owner' });
          await outbox.delete(entry.id as number);
        }
      }
    });

    // v22: local SM-2 state mirror + immutable rating-event log (plan 061
    // step 2). Lets grading enqueue a rating with no network read: the
    // mirror supplies the "current state" that used to require a live
    // Supabase SELECT, and the event log is what actually gets replayed
    // against the transactional apply_*_rating_event RPCs.
    this.version(22).stores({
      srsEntityState: 'id, userId, entityType, [userId+entityType], [userId+entityType+entityId], [userId+entityType+topic]',
      srsRatingEvents: 'id, userId, status, [userId+status], [userId+entityType+entityId], [userId+entityType+topic]',
    });

    // v23: exact Tracking review queues. The user-leading index prevents a
    // session created by account A from being loaded by account B offline.
    this.version(23).stores({
      trackingReviewSessions: 'id, userId, createdAt, expiresAt, [userId+createdAt]',
    });

    // v24: local mirror of completed pronunciation diagnostics (plan 067
    // step 6) — offline-first survival + idempotency marker for outbox sync.
    this.version(24).stores({
      pronunciationAssessments: 'id, userId, [userId+createdAt], syncedAt',
    });

    // v25: replacement stores for the two v21 stores whose primary keys were
    // incorrectly changed in-place. The old stores remain as quarantined
    // migration sources; the live table handles below point at these stores.
    this.version(25).stores({
      pronunciationMasteryV2: '[userId+phrase], userId, phrase, masteredAt',
      pronunciationCoachStateV2: '[userId+key], userId, key, updatedAt',
    });

    // v26: formal version bump after editing v21's mastery/coach declarations
    // (Dexie 4 SchemaDiff warning). Also finish account-scoping analyticsEvents.
    this.version(26).stores({
      pronunciationMastery: 'phrase, userId, masteredAt',
      pronunciationCoachState: 'key, userId, updatedAt',
      pronunciationMasteryV2: '[userId+phrase], userId, phrase, masteredAt',
      pronunciationCoachStateV2: '[userId+key], userId, key, updatedAt',
      analyticsEvents: '++id, userId, name, timestamp, synced, [userId+timestamp]',
    });
    this.version(27).stores({
      pronunciationFeedbackEvidence: 'id, userId, targetId, occurredAt, [userId+targetId], [userId+occurredAt]',
    });
    this.version(28).stores({
      missionSessions: 'id, userId, missionId, [userId+missionId], [userId+startedAt]',
    });
    // v29: essential_words entityType + FSRS-precursor fields on
    // srsRatingEvents (Fase A, essential-words-learning-sessions-design
    // §3.3). Purely additive — no index/store-shape change.
    this.version(29).stores({
      srsRatingEvents: 'id, userId, status, [userId+status], [userId+entityType+entityId], [userId+entityType+topic]',
    });
    // v30: pre-graduation Essential Words progress, scoped by account.
    this.version(30).stores({
      essentialWordProgress: 'id, userId, wordId, [userId+wordId], lastLevelAt',
    });
    // v31: skill-model local records. Indexed schedule mirrors make the
    // planner queryable without persisting derived status or maturity.
    this.version(31).stores({
      learningItems: 'id, userId, [userId+wordId], [userId+skill], [userId+dueAt], [userId+scheduleKind], updatedAt',
      attemptLogs: 'id, userId, [userId+sessionId], [userId+wordId], [userId+occurredAt], synced',
      srsReviewEvents: 'id, userId, [userId+attemptLogId], [userId+learningItemId], [userId+occurredAt], synced',
    });
    // v32: device-local resumable Essential Words session, one row per account.
    this.version(32).stores({
      essentialWordSessionDrafts: 'userId, updatedAt, sessionId',
    });
    // v33: Gemini-generated scripts table
    this.version(33).stores({
      generatedScripts: 'id, userId, [userId+createdAt], createdAt',
    });
    // v34: offline cache for sounds and contrast progress (plan 080)
    this.version(34).stores({
      cachedSounds: 'id, ipa, category',
      cachedContrastProgress: 'key, userId, contrastId, [userId+contrastId], nextReview, updatedAt',
    });
    // v35: downloaded lessons for on-demand offline study (hybrid model)
    this.version(35).stores({
      downloadedLessons: 'id, trackId, lessonNumber, slug, downloadedAt, [trackId+lessonNumber]',
    });


    this.pronunciationMastery = this.table("pronunciationMasteryV2") as Table<PronunciationMasteryRecord, string>;
    this.pronunciationCoachState = this.table("pronunciationCoachStateV2") as Table<PronunciationCoachStateRecord, string>;
  }
}

export const db = new PronunciationDB();

function isFatalIndexedDbSchemaError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const name = "name" in error ? String(error.name) : "";
  const message = "message" in error ? String(error.message) : "";
  return name === "UpgradeError" || /changing primary key/i.test(message);
}

const OPEN_ATTEMPTS = 3;
let dbReadyPromise: Promise<void> | null = null;

async function openWithRecovery(): Promise<void> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= OPEN_ATTEMPTS; attempt++) {
    if (db.isOpen()) return;
    try {
      await db.open();
      return;
    } catch (error) {
      lastError = error;
      // Dexie's Chrome UnknownError workaround may close+reopen underneath
      // the rejected open(); the connection can already be usable.
      if (db.isOpen()) return;
      if (isFatalIndexedDbSchemaError(error) && attempt >= 2) break;
    }
  }

  if (isFatalIndexedDbSchemaError(lastError)) {
    console.warn("[db] Recreating pronunciation-journal after fatal IndexedDB error", lastError);
    await db.delete();
    await db.open();
    return;
  }
  throw lastError;
}

/**
 * Open IndexedDB, recreating it when a prior schema upgrade left the
 * connection closed (e.g. Dexie UpgradeError on primary-key changes).
 * Also retries Chrome's transient UnknownError-on-open (Dexie then surfaces
 * DatabaseClosedError to in-flight queries). Concurrent callers share one
 * in-flight promise.
 */
export function ensureDbReady(): Promise<void> {
  if (typeof indexedDB === "undefined") return Promise.resolve();
  if (db.isOpen() && !dbReadyPromise) return Promise.resolve();
  if (!dbReadyPromise) {
    dbReadyPromise = openWithRecovery().finally(() => {
      dbReadyPromise = null;
    });
  }
  return dbReadyPromise;
}

// ── Attempt Helpers ──

export async function saveAttempt(attempt: Omit<Attempt, "id">, userId?: string): Promise<number | undefined> {
  if (!userId) return undefined;
  return db.attempts.add({ ...attempt, userId } as Attempt);
}

export async function getRecentAttempts(limit = 50, userId?: string): Promise<Attempt[]> {
  if (!userId) return [];
  return db.attempts.where('userId').equals(userId).sortBy('timestamp').then((rows) => rows.reverse().slice(0, limit));
}

export async function getAttemptsByLessonId(lessonId: string, userId?: string): Promise<Attempt[]> {
  if (!userId) return [];
  return db.attempts.where('[userId+lessonId]').equals([userId, lessonId]).toArray();
}

// ── SRS Helpers ──

export async function getSRSData(wordId: string, userId?: string): Promise<SRSData | undefined> {
  if (!userId) return undefined;
  return db.srsData.where('[userId+wordId]').equals([userId, wordId]).first();
}

export async function saveSRSData(data: SRSData, userId?: string): Promise<void> {
  if (!userId) return;
  await db.srsData.put({ ...data, userId } as SRSData);
}

// ── Reader Passage Helpers ──

export async function saveReaderPassage(p: ReaderPassage): Promise<void> {
  await db.readerPassages.put(p);
}

/** Most recent cached passage for this user + target set, or undefined. */
export async function getCachedReaderPassage(
  userId: string,
  targetHash: string,
): Promise<ReaderPassage | undefined> {
  const rows = await db.readerPassages
    .where("targetHash").equals(targetHash)
    .filter((p) => p.userId === userId)
    .toArray();
  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}

// ── Daily Progress Helpers ──

function getTodayKey(): string {
  return getTodayLocalDateKey();
}

export async function updateDailyProgress(
  accuracy: number,
  word: string,
  xpEarned: number,
  userId?: string,
): Promise<void> {
  if (!userId) return;
  const today = getTodayKey();
  const existing = await db.dailyProgress.where('[userId+date]').equals([userId, today]).first();

  if (existing) {
    const wordsSet = new Set(existing.wordsStudied);
    wordsSet.add(word);
    const totalAttempts = existing.totalAttempts + 1;
    const correctAttempts = existing.correctAttempts + (accuracy >= 70 ? 1 : 0);

    await db.dailyProgress.update(existing.id!, {
      totalAttempts,
      correctAttempts,
      averageAccuracy: Math.round(
        (existing.averageAccuracy * existing.totalAttempts + accuracy) / totalAttempts
      ),
      xp: existing.xp + xpEarned,
      wordsStudied: Array.from(wordsSet),
    });
  } else {
    await db.dailyProgress.add({
      userId, date: today,
      totalAttempts: 1,
      correctAttempts: accuracy >= 70 ? 1 : 0,
      averageAccuracy: Math.round(accuracy),
      xp: xpEarned,
      wordsStudied: [word],
    });
  }
}

// ── Core 1000 Helpers ──

const CORE1000_SRS_PREFIX = "c1k:";

const archivedMigrationPromises = new Map<string, Promise<number>>();

/** One-time idempotent migration: legacy `archived` → `status: snoozed`. */
export async function migrateArchivedSrsRows(userId?: string): Promise<number> {
  if (!userId) return 0;
  const existingPromise = archivedMigrationPromises.get(userId);
  if (!existingPromise) {
    const migration = (async () => {
      const all = await db.srsData.where('userId').equals(userId).toArray();
      let count = 0;
      for (const entry of all) {
        const migrated = migrateArchivedRow(entry);
        if (migrated !== entry) {
          await db.srsData.put({ ...migrated, userId });
          count++;
        }
      }
      return count;
    })().catch((err) => {
      archivedMigrationPromises.delete(userId);
      throw err;
    });
    archivedMigrationPromises.set(userId, migration);
  }
  return archivedMigrationPromises.get(userId)!;
}

/**
 * Todas las entradas SRS del Core 1000.
 *
 * Las archivadas deben conservarse para que el constructor de la cola pueda
 * tratarlas como palabras ya vistas sin programarlas para repaso.
 */
export async function getEssentialWordsSrsEntries(userId?: string): Promise<SRSData[]> {
  if (!userId) return [];
  await migrateArchivedSrsRows(userId);
  return db.srsData
    .filter((e) => e.userId === userId && e.wordId.startsWith(CORE1000_SRS_PREFIX))
    .toArray();
}

export interface EssentialWordsReviewEventInput {
  userId: string;
  wordId: string;
  grade: number;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  state: "new" | "learning" | "review" | "relearning";
  hintsUsed: number;
  latencyMs: number;
  isRepair?: boolean;
}

/** Writes the irreconstructible Essential Words review log. Fase A records
 * it only; later phases may consume it for scheduling. */
export async function recordEssentialWordsReviewEvent(
  input: EssentialWordsReviewEventInput,
): Promise<void> {
  const now = new Date().toISOString();
  await db.srsRatingEvents.add({
    id: crypto.randomUUID(),
    userId: input.userId,
    entityType: "essential_words",
    entityId: input.wordId,
    grade: input.grade,
    occurredAt: now,
    status: "pending",
    createdAt: now,
    stability: input.stability,
    difficulty: input.difficulty,
    elapsedDays: input.elapsedDays,
    state: input.state,
    hintsUsed: input.hintsUsed,
    latencyMs: input.latencyMs,
    isRepair: input.isRepair ?? false,
  });
}

function essentialWordProgressId(wordId: string, userId: string): string {
  return `${userId}:${wordId}`;
}

/** Pre-graduation progress for one word, or undefined if none is stored. */
export async function getEssentialWordProgress(
  wordId: string,
  userId: string,
): Promise<EssentialWordProgressRecord | undefined> {
  return db.essentialWordProgress.get(essentialWordProgressId(wordId, userId));
}

/** All unfinished pre-graduation words for one account. */
export async function getEssentialWordProgressForUser(
  userId: string,
): Promise<EssentialWordProgressRecord[]> {
  return db.essentialWordProgress.where('userId').equals(userId).toArray();
}

/** Upserts pre-graduation progress for a word and account. */
export async function saveEssentialWordProgress(
  record: Omit<EssentialWordProgressRecord, "id">,
): Promise<void> {
  await db.essentialWordProgress.put({
    ...record,
    id: essentialWordProgressId(record.wordId, record.userId),
  });
}

/** Removes pre-graduation progress on graduation or expired resumption. */
export async function archiveEssentialWordProgress(wordId: string, userId: string): Promise<void> {
  await db.essentialWordProgress.delete(essentialWordProgressId(wordId, userId));
}

async function getOrCreateEssentialWordSrsRow(word: string, userId?: string): Promise<SRSData | undefined> {
  if (!userId) return undefined;
  const normalized = word.toLowerCase();
  const wordId = `${CORE1000_SRS_PREFIX}${normalized}`;
  return (await getSRSData(wordId, userId)) ?? {
    wordId,
    word: normalized,
    ease: 2.5,
    interval: 0,
    repetitions: 0,
    nextReview: new Date().toISOString(),
  };
}

/** Pausa una palabra esencial — la saca del flujo de repaso hasta `nextReview`. */
export async function snoozeEssentialWord(word: string, days = 90, userId?: string): Promise<void> {
  const existing = await getOrCreateEssentialWordSrsRow(word, userId);
  if (existing) await saveSRSData(patchSnooze(existing, new Date(), days), userId);
}

/** Marca una palabra esencial como dominada (sin repaso programado). */
export async function masterEssentialWord(word: string, userId?: string): Promise<void> {
  const existing = await getOrCreateEssentialWordSrsRow(word, userId);
  if (existing) await saveSRSData(patchMaster(existing, new Date()), userId);
}

/** Reactiva una palabra esencial para repaso inmediato. */
export async function activateEssentialWordNow(word: string, userId?: string): Promise<void> {
  const existing = await getOrCreateEssentialWordSrsRow(word, userId);
  if (existing) await saveSRSData(patchActivateNow(existing, new Date()), userId);
}

/** @deprecated Use snoozeEssentialWord */
export async function archiveEssentialWord(word: string): Promise<void> {
  return snoozeEssentialWord(word, 90);
}

/** @deprecated Use activateEssentialWordNow */
export async function unarchiveEssentialWord(word: string): Promise<void> {
  return activateEssentialWordNow(word);
}

/** Palabras del Core 1000 introducidas hoy (para el cupo de nuevas). */
export async function getEssentialWordsIntroducedToday(userId?: string): Promise<string[]> {
  if (!userId) return [];
  const row = await db.dailyProgress.where('[userId+date]').equals([userId, getTodayKey()]).first();
  return row?.core1000NewWords ?? [];
}

/** Registra una palabra nueva introducida hoy. Crea la fila del día si no existe. */
export async function recordEssentialWordIntroduction(word: string, userId?: string): Promise<void> {
  if (!userId) return;
  const today = getTodayKey();
  const existing = await db.dailyProgress.where('[userId+date]').equals([userId, today]).first();
  if (existing) {
    const set = new Set(existing.core1000NewWords ?? []);
    set.add(word);
    await db.dailyProgress.update(existing.id!, { core1000NewWords: [...set] });
  } else {
    await db.dailyProgress.add({
      userId, date: today,
      totalAttempts: 0,
      correctAttempts: 0,
      averageAccuracy: 0,
      xp: 0,
      wordsStudied: [],
      core1000NewWords: [word],
    });
  }
}

// ── User Stats Helpers ──

export async function getUserStats(userId?: string): Promise<UserStats> {
  if (!userId) return { currentStreak: 0, longestStreak: 0, totalXP: 0, totalWords: 0, totalAttempts: 0, averageAccuracy: 0, lastStudyDate: "" };
  const stats = await db.userStats.where('userId').equals(userId).first();
  if (stats) return stats;

  const defaultStats: UserStats = {
    currentStreak: 0,
    longestStreak: 0,
    totalXP: 0,
    totalWords: 0,
    totalAttempts: 0,
    averageAccuracy: 0,
    lastStudyDate: "",
  };
  await db.userStats.add({ ...defaultStats, userId });
  return defaultStats;
}

export async function updateUserStats(
  accuracy: number,
  xpEarned: number,
  userId?: string,
): Promise<UserStats> {
  if (!userId) return getUserStats();
  const stats = await getUserStats(userId);
  const today = getTodayKey();
  const yesterday = getRelativeLocalDateKey(-1);

  let newStreak = stats.currentStreak;
  if (stats.lastStudyDate === today) {
    // Already studied today, keep streak
  } else if (stats.lastStudyDate === yesterday) {
    newStreak += 1;
  } else if (stats.lastStudyDate === "") {
    newStreak = 1;
  } else {
    newStreak = 1; // streak broken
  }

  const totalAttempts = stats.totalAttempts + 1;
  const updated: UserStats = {
    ...stats,
    currentStreak: newStreak,
    longestStreak: Math.max(stats.longestStreak, newStreak),
    totalXP: stats.totalXP + xpEarned,
    totalAttempts,
    averageAccuracy: Math.round(
      (stats.averageAccuracy * stats.totalAttempts + accuracy) / totalAttempts
    ),
    lastStudyDate: today,
  };

  const existing = await db.userStats.where('userId').equals(userId).first();
  if (existing) {
    await db.userStats.update(existing.id!, updated);
  }

  return updated;
}

// ── Favorites Helpers ──

export async function getFavorites(userId?: string): Promise<FavoriteWord[]> {
  if (!userId) return [];
  return db.favorites.where('userId').equals(userId).sortBy('addedAt').then((rows) => rows.reverse());
}

export async function isFavorite(word: string, userId?: string): Promise<boolean> {
  if (!userId) return false;
  const count = await db.favorites.where('[userId+word]').equals([userId, word.toLowerCase()]).count();
  return count > 0;
}

export async function addFavorite(word: string, lessonId: string, ipa?: string, userId?: string): Promise<void> {
  if (!userId) return;
  const exists = await isFavorite(word, userId);
  if (!exists) {
    await db.favorites.add({
      userId, word: word.toLowerCase(),
      lessonId,
      ipa,
      addedAt: new Date().toISOString(),
    });
  }
}

export async function removeFavorite(word: string, userId?: string): Promise<void> {
  if (userId) await db.favorites.where('[userId+word]').equals([userId, word.toLowerCase()]).delete();
}

export async function toggleFavorite(word: string, lessonId: string, ipa?: string, userId?: string): Promise<boolean> {
  const exists = await isFavorite(word, userId);
  if (exists) {
    await removeFavorite(word, userId);
    return false;
  } else {
    await addFavorite(word, lessonId, ipa, userId);
    return true;
  }
}

// ── Needs Practice Helpers ──
// Words where the user's best attempt accuracy is below 75%

export async function getNeedsPracticeWords(userId?: string): Promise<{ word: string; lessonId: string; bestAccuracy: number; attempts: number }[]> {
  if (!userId) return [];
  const allAttempts = await db.attempts.where('userId').equals(userId).toArray();

  // Group by word
  const map = new Map<string, { lessonId: string; bestAccuracy: number; attempts: number }>();
  for (const a of allAttempts) {
    const key = a.word.toLowerCase();
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { lessonId: a.lessonId, bestAccuracy: a.accuracy, attempts: 1 });
    } else {
      existing.bestAccuracy = Math.max(existing.bestAccuracy, a.accuracy);
      existing.attempts += 1;
    }
  }

  const result: { word: string; lessonId: string; bestAccuracy: number; attempts: number }[] = [];
  for (const [word, data] of map.entries()) {
    if (data.bestAccuracy < 75) {
      result.push({ word, ...data });
    }
  }

  // Sort by worst accuracy first
  return result.sort((a, b) => a.bestAccuracy - b.bestAccuracy);
}

// ── Lesson Session Offset Helpers ──
// Tracks which chunk of words to show next for DB-generated lessons (10 words/session)

export const LESSON_SESSION_SIZE = 10

export async function getLessonOffset(lessonId: string, userId?: string): Promise<number> {
  if (!userId) return 0;
  const row = await db.lessonOffsets.where('[userId+lessonId]').equals([userId, lessonId]).first()
  return row?.offset ?? 0
}

export async function advanceLessonOffset(lessonId: string, totalWords: number, userId?: string): Promise<number> {
  if (!userId) return 0;
  const current = await getLessonOffset(lessonId, userId)
  const next = (current + LESSON_SESSION_SIZE) % totalWords
  await db.lessonOffsets.put({ lessonId: `${userId}:${lessonId}`, userId, offset: next })
  return next
}

// ── Course Lesson Completion Helpers ──

export function lessonCompletionKey(userId: string, courseSlug: string, lessonSlug: string): string {
  return `${userId}:${courseSlug}:${lessonSlug}`;
}

export async function markLessonComplete(userId: string, courseSlug: string, lessonSlug: string, source = 'lesson_completion'): Promise<void> {
  const now = new Date().toISOString();
  await db.completedLessons.put({
    key: lessonCompletionKey(userId, courseSlug, lessonSlug),
    userId,
    courseSlug,
    lessonSlug,
    completedAt: now,
    source,
    updatedAt: now,
  });
}

export async function markLessonIncomplete(userId: string, courseSlug: string, lessonSlug: string): Promise<void> {
  await db.completedLessons.delete(lessonCompletionKey(userId, courseSlug, lessonSlug));
}

export async function isLessonComplete(userId: string, courseSlug: string, lessonSlug: string): Promise<boolean>
export async function isLessonComplete(courseSlug: string, lessonSlug: string): Promise<boolean>
export async function isLessonComplete(a: string, b: string, c?: string): Promise<boolean> {
  const key = c ? lessonCompletionKey(a, b, c) : `${a}:${b}`;
  const row = await db.completedLessons.get(key);
  return !!row;
}

export async function getCompletedCountByCourse(userId: string): Promise<Record<string, number>> {
  const all = await db.completedLessons.where("userId").equals(userId).toArray();
  const counts: Record<string, number> = {};
  for (const row of all) {
    counts[row.courseSlug] = (counts[row.courseSlug] ?? 0) + 1;
  }
  return counts;
}

// ── IPA Exploration Helpers ──

export async function markPhonemeExplored(symbol: string, userId?: string): Promise<void> {
  if (!userId) return;
  const date = getTodayKey();
  const key = `${userId}:${date}:${symbol}`;
  await db.ipaExplorations.put({
    key, userId,
    date,
    symbol,
    exploredAt: new Date().toISOString(),
  });
}

export async function getExploredSymbolsToday(userId?: string): Promise<string[]> {
  if (!userId) return [];
  const date = getTodayKey();
  const rows = await db.ipaExplorations.where('[userId+date]').equals([userId, date]).toArray();
  return rows.map((row) => row.symbol);
}

export async function resetTodaysExplorations(userId?: string): Promise<void> {
  if (!userId) return;
  const date = getTodayKey();
  await db.ipaExplorations.where('[userId+date]').equals([userId, date]).delete();
}

// ── Practice Prefs Helpers ──

const LAST_PRACTICE_MODE_KEY = "lastPracticeMode";
const INTERESTS_PREF_KEY_PREFIX = "interests:";

export async function cacheUserInterests(userId: string, interests: readonly string[]): Promise<void> {
  await db.practicePrefs.put({
    key: `${INTERESTS_PREF_KEY_PREFIX}${userId}`,
    value: JSON.stringify(interests),
    updatedAt: new Date().toISOString(),
  });
}

export async function getCachedUserInterests(userId: string): Promise<string[] | null> {
  const row = await db.practicePrefs.get(`${INTERESTS_PREF_KEY_PREFIX}${userId}`);
  if (!row) return null;
  try {
    const value: unknown = JSON.parse(row.value);
    return Array.isArray(value) && value.every((item) => typeof item === 'string') ? value : null;
  } catch {
    return null;
  }
}

/** Remember the last practice mode the user entered (for the hub recommendation). */
export async function setLastPracticeMode(modeId: string): Promise<void> {
  await db.practicePrefs.put({
    key: LAST_PRACTICE_MODE_KEY,
    value: modeId,
    updatedAt: new Date().toISOString(),
  });
}

/** The last practice mode id the user entered, or null if none recorded. */
export async function getLastPracticeMode(): Promise<string | null> {
  const row = await db.practicePrefs.get(LAST_PRACTICE_MODE_KEY);
  return row?.value ?? null;
}

// ── AI Coach Pronunciation Mastery Helpers ──

export async function getPronunciationMasteredPhrases(userId: string): Promise<string[]> {
  const rows = await db.pronunciationMastery.where('userId').equals(userId).toArray();
  return rows.map((row) => row.phrase);
}

export async function savePronunciationMasteredPhrases(
  userId: string,
  phrases: Iterable<string>,
  options: { migratedFromLocalStorage?: boolean } = {},
): Promise<void> {
  const masteredAt = new Date().toISOString();
  const rows: PronunciationMasteryRecord[] = [...new Set(phrases)].map((phrase) => ({
    userId,
    phrase,
    masteredAt,
    migratedFromLocalStorage: options.migratedFromLocalStorage ? 1 : 0,
  }));

  await db.transaction("rw", db.pronunciationMastery, async () => {
    await db.pronunciationMastery.where('userId').equals(userId).delete();
    if (rows.length > 0) {
      await db.pronunciationMastery.bulkPut(rows);
    }
  });
}

export async function getPronunciationCoachState(
  userId: string,
  key: PronunciationCoachStateRecord["key"],
): Promise<string[] | undefined> {
  const row = await db.pronunciationCoachState.get([userId, key]);
  return row?.values;
}

export async function savePronunciationCoachState(
  userId: string,
  key: PronunciationCoachStateRecord["key"],
  values: Iterable<string>,
  options: { migratedFromLocalStorage?: boolean } = {},
): Promise<void> {
  await db.pronunciationCoachState.put({
    userId,
    key,
    values: [...new Set(values)],
    updatedAt: new Date().toISOString(),
    migratedFromLocalStorage: options.migratedFromLocalStorage ? 1 : 0,
  });
}

export async function getDownloadedLesson(id: string): Promise<DownloadedLessonRecord | undefined> {
  return db.downloadedLessons.get(id);
}

export async function saveDownloadedLesson(record: DownloadedLessonRecord): Promise<void> {
  await db.downloadedLessons.put(record);
}

export async function deleteDownloadedLesson(id: string): Promise<void> {
  await db.downloadedLessons.delete(id);
}

export async function listDownloadedLessons(trackId?: string): Promise<DownloadedLessonRecord[]> {
  if (trackId) {
    return db.downloadedLessons.where('trackId').equals(trackId).toArray();
  }
  return db.downloadedLessons.toArray();
}

export async function isLessonDownloaded(id: string): Promise<boolean> {
  const record = await db.downloadedLessons.get(id);
  return record !== undefined;
}

# Progress telemetry

This document defines the telemetry mechanics. The product-wide relationship
between content, canonical targets, practice, scheduling and learner-facing
progress is defined in [Integrated learning loop](integrated-learning-loop.md).

Completed practice sessions use `recordActivitySession` in
`lib/progress/activity-hub.ts`. Its pure `buildSessionTelemetry` contract
normalizes the session summary, answer-level records, daily-plan reconciliation,
and skill tags before persistence.

## Storage responsibilities

- `activity_sessions` stores one compact row per completed session. It is the
  source for recent activity and weekly exercise totals.
- `answer_history` stores individual answers. It remains the source for
  accuracy, detailed skill analysis, and SRS routing.
- Domain tables retain specialized state. For example,
  `user_contrast_progress` remains authoritative for contrast mastery.

Answers are currently persisted as each exercise completes so offline progress
is not lost. The session hub does not insert them again; its normalized
`answers` output makes the shared contract explicit without duplicating rows.

## Adding a practice surface

Build a `SessionResult` from its completed exercises and call
`recordActivitySession` once when the coherent session ends. Pass a canonical
`PracticeContext`, an optional source override, and only routing identifiers in
domain metadata. Do not place transcripts, long AI feedback, or other private
free-form text in `activity_sessions`.

Before wiring a new surface, classify its action as exposure, completion,
intent, objective evidence or transfer. Only evaluable answers create
`PracticeAnswer` rows. Reading, bookmarking and lesson completion use their
domain writers and must not be converted into synthetic answers.

## Learner-facing projections

Progress is read-only and keeps three projections separate:

- activity: sessions, exercises, consistency and time;
- coverage: content viewed or explicitly completed;
- learning: retention, objective evidence, target weakness and transfer.

Do not infer learning from a streak, bookmark, lesson completion or raw volume.
Domain provenance remains visible when a learner-facing claim is derived.
The pure boundary lives in `lib/progress/projections.ts`; server queries feed it
attributed answers, completion rows and activity summaries. A later negative
objective result replaces the prior target result in the learning projection
and exposes that target as needing review.

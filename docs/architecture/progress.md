# Progress telemetry

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

# ADR 066: Canonical pronunciation target registry

- **Status**: Steps 1-6 executed.
- **Plan**: `plans/066-create-pronunciation-target-registry.md`
- **Depends on**: plan 062 (`lib/exercises/*` evidence attribution), ADR 064 (acoustic evaluator contract, not yet shipped)

## Context

The app has fragmented pronunciation identity:

- Sound Lab persists segmental progress as `contrast_id = "ipaA|ipaB"` (`lib/phoneme-practice/types.ts`).
- Course lessons flag a Sound Lab handoff with a bare boolean, `CoursePathLesson.soundLab?: boolean`
  (`lib/courses/types.ts`) — no identification of *which* skill.
- Grammar decks expose free-form IPA strings, `GrammarStudyDeckData.sounds?: string[]`
  (`lib/courses/grammar-deck/types.ts`) — no distinction between phoneme, contrast, stress, rhythm
  or intonation.
- `lib/courses/curriculum.ts` has a `connected-speech` elective track (reductions, linking, elision,
  assimilation) with no typed link to the underlying skill.

Without one shared identity, diagnostic, curriculum, evidence and repeat cannot point at the same
target verifiably. This ADR defines that identity as `PronunciationTarget` — a naming and
evidence-capability contract, not a scoring or SRS change.

## Categories

A `PronunciationTarget` is a discriminated union keyed by a stable, versionable `id` string:

- `segmental.phoneme.<ipa-key>` — a single phoneme (e.g. `segmental.phoneme./θ/`).
- `segmental.contrast.<canonical-pair>` — a minimal-pair contrast, canonicalized via the existing
  `contrastKey()` helper (`lib/phoneme-practice/phoneme-similarity.ts`) so `(/θ/, /ð/)` and
  `(/ð/, /θ/)` always resolve to the same id (`segmental.contrast./ð/|/θ/`).
- `prosody.word-stress`, `prosody.sentence-stress`, `prosody.rhythm` — fixed-id prosody targets
  (no sub-key; the app does not yet distinguish sub-patterns for these).
- `prosody.intonation.<pattern>` — an intonation pattern (e.g. `prosody.intonation.rising-question`).
- `connected.reduction.<pattern>`, `connected.linking`, `connected.elision`, `connected.assimilation`
  — the connected-speech track's four skills.

Contexts and carrier phrases are **not** targets. They are transfer material that *references*
targets; they never become independent mastery targets by default.

## Canonicalization rules

- Segmental contrast ids reuse `contrastKey()` — this ADR does not reimplement pair ordering.
- Ids are lowercase, dot-separated, stable across releases. Renaming an id is a breaking change to
  every content file and progress adapter that references it; do not do it casually.
- Existing production ids (`contrast_id` rows in `user_contrast_progress`) are **not** migrated.
  `lib/pronunciation/targets/registry.ts` provides `contrastIdToTargetId` / `targetIdToContrastId`
  adapters so the old and new identities interoperate without a data migration.

## Evidence capability contract

Every target declares which evidence modes can legitimately establish mastery for it:

- `perception` — the learner can discriminate the target (e.g. AX/ABX exercises).
- `controlled_production` — the learner produces the target in an isolated word/phrase.
- `contextual_production` — the learner produces the target in a full sentence/conversation.
- `stt_intelligibility` — STT recognized the words spoken (the *only* scoring signal wired to
  production today — see `lib/pronunciation/spoken-attempt.ts`, `ScoreKind`).
- `acoustic` — a dedicated acoustic evaluator scored a dimension (`lib/pronunciation/acoustic-evaluator.ts`,
  `AcousticDimension`). **No such evaluator exists in production.** ADR 064 validated the scoring
  *direction* only; it did not ship or authorize an evaluator. Plan 071's benchmark decision
  (ship / partial-ship / no-ship) gates whether any target may claim `acoustic`.

A target that is `masteryEligible` must declare at least one *objective* modality
(`stt_intelligibility` or `acoustic`) — `perception` and self-reported production alone cannot
establish mastery. A target must not declare `acoustic` unless plan 071 has shipped a validated
evaluator; the registry's validator rejects such a claim today by construction (see
`lib/pronunciation/targets/__tests__/registry.test.ts`).

"Scored by STT", "self-reported" and "acoustically evaluated" are distinct capabilities and must
never be conflated in target metadata or in UI copy.

## CEFR is a recommendation, not proof

Each target may declare a `recommendedCefr` level. This is pedagogical sequencing guidance only —
it is not evidence of mastery and must not be read as a claim that a learner at that CEFR level
has mastered the target.

## Non-goals (out of scope for this ADR)

- No change to `user_contrast_progress`, SRS formulas, or any persisted progress table.
- No pronunciation diagnostic, learning route, chat missions, or acoustic evaluator implementation
  in *this* ADR (plans 067–071 own those surfaces). The learning route now lives at
  `/courses/pronunciation` — see `docs/architecture/pronunciation-learning-route.md`.
- No runtime inference of target ids from lesson titles or AI. All content-to-target mapping is
  authored in `lib/pronunciation/targets/content-map.ts` and validated by
  `lib/courses/__tests__/content-audit.test.ts`; unmapped/unresolved ids fail the audit rather than
  falling back to a guessed target.

## Ownership

New pronunciation lessons, exercise generators, diagnostic items and missions must reference
`PronunciationTargetId` from this registry. Reviewers should reject new free-form pronunciation
namespaces, or any mastery claim whose target does not declare a supporting evidence capability.

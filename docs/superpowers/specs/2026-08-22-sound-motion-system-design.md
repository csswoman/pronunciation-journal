# Sound & Motion System — Design Spec

Date: 2026-08-22
Status: Approved, pending implementation plan

## Problem

The app feels "dead": animation exists broadly (`transition-*` appears in 218
component files) but sound is nearly absent outside practice exercises.
`playUiCue` is only called from 25 files, almost all in
`components/phoneme-practice/` and `components/practice/`. Global navigation,
vocabulary/decks/journal, AI coach/progress, and home/daily have zero audio
feedback and inconsistent, ad hoc motion.

## Goals

- Add a curated, semantic set of new sound cues covering navigation, content
  actions (save/create/delete/duplicate), progress/achievement moments, and
  AI Coach chat turns.
- Add a small set of **reusable** motion patterns (not bespoke
  per-component animation) applied consistently across all four domains.
- Do this without breaking the existing exercise-feedback sound system, and
  without regressing offline mode, bundle size, or `prefers-reduced-motion`
  support.

## Non-goals

- Replacing the existing synthesized cue engine (`lib/ui-sounds/engine.ts`)
  or `cuelume`. Those keep serving today's 9 cues untouched.
- Implementing all four consumer domains in one pass. This spec's
  implementation plan covers the audio/motion foundation plus the
  navigation domain; vocabulary/journal, AI coach/progress, and home/daily
  are mapped here but land as follow-up plans.
- Producing the actual audio sample files. That's an external step (the
  user generates them via Antigravity from the brief this spec produces);
  this repo only defines the contract (file names, format, duration,
  loading path) the samples must satisfy.

## Architecture

### Two audio engines, one public API

- **Existing engine** (`lib/ui-sounds/engine.ts`): synthesized Web Audio
  API tones/noise recipes. Continues to serve the current 9 cues (`tap`,
  `correct`, `wrong`, `press`, `release`, `toggle`, `hover`, `reveal`,
  `soft`). No changes to its recipes or call sites.
- **New engine** (`lib/ui-sounds/tone-engine.ts`): wraps **Tone.js**.
  Loads short sample files (generated externally, dropped into
  `public/sounds/`) via `Tone.Players`, routed through a shared
  `Tone.Reverb` + `Tone.Volume` bus. Volume and enabled/disabled state stay
  bound to the same `useUISoundsStore` and the same
  `prefers-reduced-motion`/sound-enabled gate already used by
  `syncCuelumeEnabled`.
- `lib/ui-sounds/cues.ts` gains a second lookup table,
  `UI_CUE_SAMPLES: Record<NewCue, string>` (cue name → sample file
  basename), alongside the existing `UI_CUE_SOUNDS`. `playUiCue(cue)`
  dispatches to whichever engine owns that cue name; call sites never know
  or care which engine is used. This keeps the public API — the only thing
  ~25+ (soon many more) consumer files import — completely stable.
- **Lazy loading**: `tone-engine.ts` and the Tone.js sample buffers load via
  dynamic `import()` on first use of any new-domain cue, not at app
  startup. Routes/exercises that never touch a new cue never pay for Tone.js
  or the sample downloads. This also preserves offline-mode behavior for
  routes that don't need the new cues; routes that do need them degrade
  silently (no sound, no crash) if the fetch fails, matching the existing
  engine's fail-soft posture (`getAudioContext` returning `null`).

### New cue set (13 cues)

Sample spec (duration, timbre character, format) lives in a separate brief
document (`docs/superpowers/specs/2026-08-22-sound-motion-system-audio-brief.md`)
written for direct hand-off to Antigravity. Cue → domain → trigger:

| Cue | Domain | Trigger |
|---|---|---|
| `nav-open` | Navigation | Opening sidebar footer panel, quick settings, nav modals |
| `nav-close` | Navigation | Closing same |
| `nav-switch` | Navigation | Changing tab/route in BottomNavMenu, Sidebar |
| `save` | Vocabulary / Journal | Saving a word, journal entry, deck edit |
| `create` | Vocabulary / Decks | Creating a deck, adding a word |
| `delete` | Vocabulary / Journal | Deleting a word or entry |
| `archive` | Vocabulary | Archiving a deck |
| `duplicate` | Decks | Duplicating a deck |
| `milestone` | Progress | Reaching a skill-profile milestone |
| `streak` | Progress / Daily | Daily streak maintained |
| `level-up` | Progress | CEFR level or similar level-up |
| `message-send` | AI Coach | User sends a chat message |
| `message-receive` | AI Coach | Coach responds |
| `coach-typing-end` | AI Coach | Typing indicator finishes |

### Motion patterns (6 reusable classes)

Implemented as CSS classes in `app/styles/animations.css` (already the
home for shared animation and already covered by the global
`prefers-reduced-motion` override in `app/styles/base.css`), not a new
animation library or per-component bespoke keyframes.

| Pattern | Mechanic | Applies to |
|---|---|---|
| `list-stagger` | Incremental `animation-delay` via `--stagger-index` custom property; fade + translateY(8px); `ease-out-quint` | Deck/word grids, journal entry lists, coach message thread, daily step lists |
| `panel-reveal` | Formalizes the existing `animate-in fade-in zoom-in-95 duration-150` combo (already used in `SidebarFooter`) into one named class | Quick settings, vocabulary modals, daily sheets |
| `success-pulse` | Two-step box-shadow/glow using `--success`/`--primary` tokens, 400ms, no bounce | Save confirmation, streak completion, milestone |
| `nav-indicator` | `transform: translate` with `ease-out-expo` on an absolutely-positioned indicator element tracking the active tab | BottomNavMenu, Sidebar, Vocabulary/AI Coach tabs |
| `press-feedback` | `active:scale-[0.97]` + `transition-transform duration-100` (already applied to today's sign-out button) generalized to a reusable class | Create/save/delete buttons across all four domains |
| `notification-bounce` | Single short keyframe, translateY, two soft ease-out bounces (no elastic) | Streak badges, new coach messages, progress counters |

All six respect the existing global `@media (prefers-reduced-motion:
reduce)` block in `app/styles/base.css`, which already zeroes
`animation-duration`/`transition-duration` — no per-pattern reduced-motion
variant needs to be authored separately, but each pattern must be verified
not to gate content visibility (per the project's existing motion rule:
reveals must enhance an already-visible default, never hide content behind
a class-triggered transition).

## Domain mapping (for future phases)

- **Navigation** (this plan's scope): `SidebarFooter` (partially done),
  `BottomNavMenu`, `Sidebar`, `NavLink`, `NavButton` — `nav-switch` +
  `nav-indicator` on route change; `nav-open`/`nav-close` on panel toggles.
- **Vocabulary / Decks / Journal** (follow-up plan): `CreateDeckModal`,
  `EditDeckModal`, `DeckCard` (archive/duplicate), `WordCard`,
  `QuickAddModal`, `JournalEditor` — `create`/`save`/`delete`/`duplicate` +
  `press-feedback` + `list-stagger` on grids.
- **AI Coach / Progress** (follow-up plan): `AICoachPanel`,
  `MessageBubble`, `ChatTabs` — `message-send`/`message-receive`/
  `coach-typing-end` + `list-stagger` on the message thread;
  `SkillProfileCard`, `ProgressCard` — `milestone`/`level-up`/`streak` +
  `success-pulse` + `notification-bounce`.
- **Home / Daily** (follow-up plan): `DailyChecklist`,
  `HomeChunkOfDayCard`, `HomeWordOfDayCard`, `DailyPlanCard` — `tap`/
  `toggle` (existing engine) for checks, `streak` + `success-pulse` on
  plan completion, `list-stagger` on step lists.

## This plan's scope

The implementation plan derived from this spec covers:

1. `tone-engine.ts` + `UI_CUE_SAMPLES` extension to `playUiCue`.
2. The 6 motion classes in `app/styles/animations.css`.
3. The audio brief document for Antigravity (sample contract).
4. Wiring the navigation domain (`SidebarFooter`, `BottomNavMenu`,
   `Sidebar`, `NavLink`, `NavButton`) end-to-end with the new cues and
   patterns, since it's the highest-traffic domain and validates the new
   engine in production before the other domains adopt it.

Vocabulary/journal, AI Coach/progress, and home/daily are mapped above but
implemented in separate follow-up plans, since covering ~40+ components
across four domains in a single plan would be unreviewable.

## Risks & mitigations

- **New dependency (Tone.js) weight**: mitigated by lazy dynamic import;
  never loaded on routes that don't trigger a new-domain cue.
- **Sample files don't exist yet**: `tone-engine.ts` must fail soft
  (no throw, no sound) if a sample fails to load or decode, same posture
  as the existing engine's `getAudioContext` returning `null`. This lets
  the code ship ahead of the actual audio files without breaking anything.
- **Two engines drift in feel**: both gate on the same store
  (`useUISoundsStore`) and volume scale conventions; the audio brief
  explicitly asks for the same "crystalline/soft" character as the
  existing recipes, no percussive/game-like tones.
- **Motion pattern duplicating existing ad hoc classes**: `panel-reveal`
  explicitly formalizes (not replaces-with-a-different-look) the
  `animate-in fade-in zoom-in-95 duration-150` combo already shipped in
  `SidebarFooter` today, avoiding a visual behavior change when it's
  adopted elsewhere.

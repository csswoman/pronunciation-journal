# UI Sounds for Exercise Interactions

**Date:** 2026-06-14  
**Status:** Approved

## Overview

Add subtle, "cute" audio feedback to all exercise and quiz interactions across the app. Sounds are synthesized at runtime using the Web Audio API — no audio files required, fully offline-compatible.

## Hook: `useUISounds`

**Location:** `hooks/useUISounds.ts`

Exposes three functions:

```ts
playTap()     // triggered on option click, before result is known
playCorrect() // triggered when answer is correct
playWrong()   // triggered when answer is wrong
```

## Sound Design

All sounds use `OscillatorNode` + `GainNode` with ADSR envelopes via `exponentialRampToValueAtTime` (no abrupt cuts / digital clicks).

| Sound | Frequency | Duration | Character |
|---|---|---|---|
| `tap` | 440Hz sine | 70ms | "Material button click" — warm, subtle |
| `correct` | 660Hz → 880Hz (fifth) | 100ms each | "Success" — clear, non-melodic |
| `wrong` | 300Hz → 250Hz slide | 120ms | "Not quite" — soft, non-punitive |

**Envelope for all sounds:**
- Attack: 5ms
- Decay: 30ms  
- Sustain: 0.3 (gain ratio)
- Release: 40ms
- Uses `exponentialRampToValueAtTime` for all ramps

**Signal chain:** `OscillatorNode → GainNode → DynamicsCompressorNode → AudioContext.destination`

The `DynamicsCompressorNode` ensures consistent volume and prevents harsh peaks, especially on Android.

## AudioContext Lifecycle

- Created **lazily** on first call — respects browser autoplay policy (requires user gesture)
- Stored in a module-level ref shared across all three functions — no new context per call
- Type: `AudioContext` (not `OfflineAudioContext`)

## User Preferences

Two layers of sound gating:

1. **System preference:** If `window.matchMedia('(prefers-reduced-motion: reduce)').matches` is true, all functions are no-ops. Rationale: users who opt out of motion often opt out of sudden sensory stimuli.
2. **App preference:** A `soundEnabled: boolean` field in a Zustand store (`lib/stores/uiSoundsStore.ts`). Defaults to `true`. The toggle UI is out of scope for this spec but the store must be in place for future settings integration.

Both must be satisfied for sounds to play.

## Integration Points

`playTap()` and `playCorrect()`/`playWrong()` are wired into these components:

| Component | File | tap | correct/wrong |
|---|---|---|---|
| `MultipleChoiceExercise` | `components/exercises/MultipleChoiceExercise.tsx` | on option click | on result |
| `FillBlankExercise` | `components/exercises/FillBlankExercise.tsx` | on option click | on result |
| `ReorderWordsExercise` | `components/exercises/ReorderWordsExercise.tsx` | on word tap | on submit result |
| `MatchPairsExercise` | `components/exercises/MatchPairsExercise.tsx` | on pair select | on match result |
| `SentenceDictationExercise` | `components/exercises/SentenceDictationExercise.tsx` | on option select | on result |
| Mini-lesson quiz | `app/mini-lessons/[slug]/page.tsx` (quiz component) | on option click | on result |

**Timing:**
- `playTap()` fires synchronously on `onClick`, before state updates
- `playCorrect()` / `playWrong()` fire at the same time as the visual feedback state change (no artificial delay)

## Files to Create / Modify

**Create:**
- `hooks/useUISounds.ts` — the hook
- `lib/stores/uiSoundsStore.ts` — Zustand store for `soundEnabled`

**Modify:**
- `components/exercises/MultipleChoiceExercise.tsx`
- `components/exercises/FillBlankExercise.tsx`
- `components/exercises/ReorderWordsExercise.tsx`
- `components/exercises/MatchPairsExercise.tsx`
- `components/exercises/SentenceDictationExercise.tsx`
- Mini-lesson quiz component (slug page or extracted component)

## Out of Scope

- Settings UI toggle for `soundEnabled` (store only)
- Volume control
- Sound for non-exercise UI (buttons, navigation, modals)
- Audio files / OGG assets

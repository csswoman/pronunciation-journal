# Audio Brief — New UI Sound Cues

For hand-off to Antigravity (or any audio-generation tool). This is the
sample contract `lib/ui-sounds/tone-engine.ts` expects — follow file names
and format exactly so the loader works without code changes.

## Reference character

Match the existing synthesized cues in `lib/ui-sounds/engine.ts`:
**crystalline, soft, sine-wave-based tones with a light shimmer/reverb
tail** (see the `chime`, `sparkle`, and `bloom` recipes there for the
target timbre). Explicitly avoid:

- Percussive / game-like sounds (no 8-bit blips, no "coin" or "achievement
  unlocked" arcade tones).
- Low, heavy, or bass-driven tones.
- Long sustains — every cue is a short accent, not a musical phrase.
- Harsh transients (hard clicks, distortion, square/saw waves as the
  primary character).

Think: wind chimes, glass, soft bells, gentle bloom/swell — an app that
sounds calm and precise, never gamey or intrusive.

## Format & delivery

- **Format**: OGG/Opus (matches the project's existing audio-format
  convention). If Opus isn't available from the generation tool, MP3
  (192kbps+) is an acceptable fallback — flag which was used.
- **Channels**: mono.
- **Sample rate**: 44.1kHz.
- **Loudness**: normalize each file to a consistent peak (~-3dB), since
  `tone-engine.ts` will NOT apply per-sample gain compensation beyond the
  shared user volume control.
- **Silence trim**: trim leading/trailing silence tightly — the engine
  triggers playback on user action and any lead-in silence reads as lag.
- **Delivery path**: place files in `public/sounds/ui/`, named exactly as
  listed below.

## Cue list

| File name | Duration target | Character notes |
|---|---|---|
| `nav-open.ogg` | 150–250ms | Soft upward swell — a panel arriving |
| `nav-close.ogg` | 120–200ms | Soft downward/fade — mirror of `nav-open`, not identical, slightly shorter |
| `nav-switch.ogg` | 100–180ms | Light, neutral tick with a touch of shimmer — quieter than `nav-open` since it fires often |
| `save.ogg` | 200–300ms | Warm, settled confirmation — like a soft "landing" |
| `create.ogg` | 200–320ms | Slightly brighter/higher than `save` — a small upward bloom |
| `delete.ogg` | 150–250ms | Soft downward glide, gentle — not alarming (this isn't destructive-irreversible in the UI it's used for; keep it neutral-soft, not negative like the existing `wrong` cue) |
| `archive.ogg` | 180–280ms | Muted, dry, brief — quieter/less shimmer than `save` |
| `duplicate.ogg` | 150–250ms | Two very close, near-identical short tones evoking "one becomes two" |
| `milestone.ogg` | 350–500ms | Fuller bloom with more shimmer/reverb tail — a bigger, more celebratory but still calm moment |
| `streak.ogg` | 300–450ms | Bright ascending short arpeggio (2–3 notes), light and encouraging |
| `level-up.ogg` | 400–550ms | Most celebratory of the set — ascending swell with shimmer tail, but stays soft/crystalline, never triumphant-brass |
| `message-send.ogg` | 90–150ms | Very light, quick — a message leaving |
| `message-receive.ogg` | 120–200ms | Slightly warmer/rounder than `message-send` — a message arriving |
| `coach-typing-end.ogg` | 80–140ms | Barely-there tick, quieter than `nav-switch` — signals readiness without demanding attention |

## Volume & mix consistency

Each file will be played through a shared bus with:

- A single `Tone.Volume` node bound to the user's in-app volume
  preference (0–100%, same scale as existing `SoundControls`).
- A shared `Tone.Reverb` send for the shimmer/tail character — so files
  should be delivered **mostly dry** (a little natural room tone is fine,
  but do not bake in a heavy reverb tail yourselves) to avoid double
  reverb once routed through the shared bus.

## Naming/scope check

This set matches exactly the 13 cues defined in the design spec
(`2026-08-22-sound-motion-system-design.md`, "New cue set" section). Do
not add or rename cues without updating that spec and
`UI_CUE_SAMPLES` in `lib/ui-sounds/cues.ts` together — the map and the
files must stay in lockstep or playback will silently no-op for a
mismatched name.

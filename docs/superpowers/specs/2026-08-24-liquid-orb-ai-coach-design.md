# Liquid Orb — AI Coach hero + thinking indicator

Status: approved
Date: 2026-08-24

## Problem

The user has a WebGPU/WGSL shader ("Glass Liquid") they like visually and want to use
as an orb for the AI Coach. The coach currently has three distinct visual surfaces:

1. Nav trigger (`AICoachTrigger` variant `nav`) — 56px button in `BottomNav`, alternates
   ✦/✕ to signal open/close state.
2. Empty-state hero (`ChatEmptyState.tsx`) — a static 44-48px gradient square with a ✦
   icon, shown when the chat panel is open with no messages yet.
3. Message avatar (`AIAvatar.tsx`) — 28px icon repeated next to every AI message bubble,
   also reused (with `state="thinking"`) inside `TypingIndicator.tsx`.

Decision: the orb replaces surfaces **2 and 3's thinking variant only** — not the nav
trigger (needs to show a close affordance the shader can't render) and not the default
message avatar (stays a small static icon for sent messages).

## Scope

**In scope:**
- New `components/ai-coach/LiquidOrb.tsx` — self-contained WebGPU orb component.
- A trimmed WGSL shader (Siri preset only) embedded in the component.
- Two mount points: `ChatEmptyState.tsx` hero, `TypingIndicator.tsx` (replacing
  `AIAvatar state="thinking"`).
- Automatic fallback to each surface's existing visual when WebGPU is unavailable.

**Out of scope:**
- Nav trigger (`AICoachTrigger`) — untouched.
- Default `AIAvatar` (non-thinking) — untouched.
- The AICoachHeader badge — untouched (explicitly deferred per user decision).
- Full shader port (glass shell, other 21 presets, 12-stop palette bank, chromatic
  metal) — not needed for a single ~112px/28px circular use case.

## Component design

`components/ai-coach/LiquidOrb.tsx`

```tsx
interface LiquidOrbProps {
  size: number;                       // px, runtime-computed → justifies style={{}}
  intensity?: "idle" | "active";      // "active" raises speed/warp uniforms
  className?: string;
}
```

- Renders a `<canvas width={size} height={size}>` sized via `style={{ width, height }}`
  (allowed under the runtime-computed-value exception in the styling rules).
- On mount: requests `navigator.gpu` → `requestAdapter()` → `requestDevice()`. Any
  failure (no `navigator.gpu`, null adapter, rejected device) sets `supported = false`
  and the component renders `null`. No internal fallback UI — the parent surface
  already renders its own default visual underneath/instead; see "Mounting" below.
- Colors are read once via `getComputedStyle(document.documentElement)` for
  `--primary`, `--primary-soft` (or `--accent`, whichever the Siri preset's 4-way split
  reads best against), converted from the project's OKLCH custom properties into linear
  RGBA floats for the uniform buffer. No hardcoded colors.
- Render loop: `requestAnimationFrame`, uniforms updated per frame (`time`, `speed`,
  `warp` — `warp`/`speed` step up when `intensity === "active"`).
- `prefers-reduced-motion: reduce` → single static frame (fixed `time`), no rAF loop.
- Cleanup on unmount: cancel rAF, `device.destroy()`.

## Shader scope

Trimmed WGSL, ported from the pasted Glass Liquid source, keeping only what
`glsSiriFluid` needs:

- Noise bank: `lqHash`, `lqNoise`, `lqFbm` (kept as-is; frequency-domain blur constants
  retained since they're part of `lqFbm`'s signature, but the extra presets that lean on
  `lqRidgeS`/`lqStepS`/`lqPowS` are dropped since Siri doesn't use them).
- `glsSiriBand`, `glsSiriFluid`, `glsFinishPresetFluid`.
- A simplified single-layer edge glow (`mfEdgeGlow`-equivalent) for the disc boundary.
- Uniform struct trimmed to: `size, time, speed, warp, ridgeAmt, sharp, shade, zoom,
  radius, colorA..colorD, highlightColor`. No shell, no palette bank, no metal uniforms.

Estimated size: ~150-200 lines vs. the ~1500-line source.

## Mounting

### 1. `ChatEmptyState.tsx` hero

Current:
```tsx
<div className="relative flex size-11 ... rounded-lg ..." style={{ background: "var(--gradient-primary)", ... }}>
  <Sparkles ... />
</div>
```

New: the existing gradient-square markup stays in the tree as the default render.
`LiquidOrb` is conditionally rendered in its place once `supported` flips true,
avoiding layout shift (same container size, orb replaces the icon+gradient inside it):

```tsx
<div className="relative flex size-11 shrink-0 items-center justify-center rounded-lg ...">
  <LiquidOrb size={44} intensity="idle" />
  {/* LiquidOrb renders null while unsupported/loading; fallback markup below stays mounted and is hidden via CSS once supported, to avoid a hydration flash */}
</div>
```

Exact composition (avoiding double-paint flash) is an implementation detail for the
plan — the contract is: WebGPU present → orb; absent → today's gradient square,
pixel-identical to current behavior.

### 2. `TypingIndicator.tsx`

Current:
```tsx
<AIAvatar state="thinking" />
```

New:
```tsx
<LiquidOrbOrAvatar size={28} />
```
Same contract: WebGPU present → `<LiquidOrb size={28} intensity="active" />`; absent →
today's `<AIAvatar state="thinking" />` (pulsing sparkle), unchanged.

A tiny shared wrapper (or inline conditional using the same `supported` check) avoids
duplicating the detection logic between the two mount points — left to the
implementation plan to decide (hook vs. small helper component).

## Testing

WebGPU doesn't exist in jsdom/Vitest. Tests mock `navigator.gpu` as `undefined` and
assert the existing fallback renders unchanged (gradient square / pulsing AIAvatar).
No test attempts to execute WGSL or drive the canvas.

## Non-goals / explicitly deferred

- Nav trigger orb — rejected (loses close affordance, shader illegible at 56px, would
  run permanently across every screen).
- Header badge orb — deferred per user decision; only empty-state hero and
  TypingIndicator get the orb in this pass.
- WebGL2/GLSL fallback for non-WebGPU browsers — rejected; existing static visuals are
  the fallback, no shader-based fallback is built.

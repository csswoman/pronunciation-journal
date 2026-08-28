// Glass Liquid — WebGPU WGSL shader for the decorative LiquidOrb.
//
// Split into section modules (each < 250 lines) so no single file holds the
// whole shader; concatenated below in the shader's own required order to
// stay bit-identical to the original single-string source. Do NOT reorder —
// WGSL top-level declarations may reference earlier ones only.
//
//   1. liquid-orb-shader-uniforms.ts      — struct Uniforms + binding
//   2. liquid-orb-shader-edge-ramp.ts     — edge-glow bank + palette-ramp bank
//   3. liquid-orb-shader-noise.ts         — fluid geometry consts + noise/fbm core
//   4. liquid-orb-shader-presets-a.ts     — presets: Siri, spectrum, aurora, plasma, chrome
//   5. liquid-orb-shader-presets-b.ts     — presets: metal, opal, frost, voice, drop, ember
//   6. liquid-orb-shader-legacy-fluid.ts  — legacy liquid bank + shading helpers
//   7. liquid-orb-shader-entry.ts         — glass compositing + vertex/fragment entry points
//
// See lib/ai-coach/__tests__/liquid-orb-shader.test.ts for the structural
// checks (balance, entry points, premultiplied alpha, uniform seed length)
// that guard this concatenation.
import { LIQUID_ORB_WGSL_UNIFORMS } from "./liquid-orb-shader-uniforms";
import { LIQUID_ORB_WGSL_EDGE_RAMP } from "./liquid-orb-shader-edge-ramp";
import { LIQUID_ORB_WGSL_NOISE } from "./liquid-orb-shader-noise";
import { LIQUID_ORB_WGSL_PRESETS_A } from "./liquid-orb-shader-presets-a";
import { LIQUID_ORB_WGSL_PRESETS_B } from "./liquid-orb-shader-presets-b";
import { LIQUID_ORB_WGSL_LEGACY_FLUID } from "./liquid-orb-shader-legacy-fluid";
import { LIQUID_ORB_WGSL_ENTRY } from "./liquid-orb-shader-entry";

export const LIQUID_ORB_WGSL =
  LIQUID_ORB_WGSL_UNIFORMS +
  LIQUID_ORB_WGSL_EDGE_RAMP +
  LIQUID_ORB_WGSL_NOISE +
  LIQUID_ORB_WGSL_PRESETS_A +
  LIQUID_ORB_WGSL_PRESETS_B +
  LIQUID_ORB_WGSL_LEGACY_FLUID +
  LIQUID_ORB_WGSL_ENTRY;

// Uniform seed for the Glass Liquid WGSL orb.
//
// The layout must match `struct Uniforms` in `liquid-orb-shader.ts` exactly:
// `size` (vec2, 2 floats) + 30 f32 scalars fill offsets 0..31 (128 bytes, so the
// colour block that follows is already 16-byte aligned and no padding is
// inserted), then 24 vec4<f32>. Total: 32 + 24 * 4 = 128 floats = 512 bytes.
//
// The fields are listed by name in declaration order rather than as a bare
// number list: a silent misalignment here shifts every colour by a slot and the
// orb renders as an unrecognisable smear, which is hard to trace back.

/** Scalar block, in struct order. `size` occupies the first two slots. */
const SCALARS: Record<string, number> = {
  sizeX: 1,
  sizeY: 1,
  time: 0,
  speed: 1.5,
  radius: 0.72,
  zoom: 0.3, // low zoom = broad, slow-reading interference cells
  warp: 2.8,
  ridgeAmt: 0.36,
  sharp: 2,
  shade: 0.1,
  sheen: 0.3,
  gloss: 0.26,
  shellMidAlpha: 0.2,
  shellEdgeAlpha: 0.2,
  exposure: 1.12,
  style: 13, // glsOpalFluid — opal interference
  edgeSoftness: 0.005,
  edgeGlow: 0,
  paletteCount: 0, // 0 = use the four colorA..colorD stops, not paletteStop*
  glassEnabled: 1,
  glassOpacity: 0.38,
  contourDeform: 0, // a true circle; > 0 makes the limb wobble
  bandDensity: 2,
  chromaticShift: 0.42,
  metalScale: 0.77,
  metalStretch: 0.23,
  metalAngle: 65,
  metalOffset: 0,
  metalPhase: 0,
  metalEvolution: 1,
  metalRoughness: 0.22,
  metalDepth: 0.25,
};

/** Colour block, in struct order. Unused palette stops stay zeroed. */
const VECTORS: Record<string, [number, number, number, number]> = {
  // The four fluid stops, ramped dark->light by `lqRamp`. The mint `colorB` is
  // load-bearing rather than a stray cold note: opal interference gets its
  // iridescence from sweeping cream -> mint -> pink -> violet, so dropping the
  // green collapses the sweep into a flat pink/violet gradient.
  colorA: [1, 0.9647, 0.9098, 1], // #FFF6E8 — cream
  colorB: [0.4314, 0.949, 0.8118, 1], // #6EF2CF — mint
  colorC: [1, 0.5686, 0.8471, 1], // #FF91D8 — pink
  colorD: [0.4588, 0.4196, 1, 1], // #756BFF — violet
  highlightColor: [1, 1, 1, 1],
  shellInner: [1, 1, 1, 1], // #FFFFFF — Refraction Base
  shellMid: [0.8039, 0.898, 1, 1], // #CDE5FF — Cool Dispersion
  // #D9C8FF — Warm Dispersion. "Warm" is relative: it is still a cold violet.
  // A genuinely warm peach here tints the rim and kills the holographic read.
  shellEdge: [0.851, 0.7843, 1, 1],
  sheenColor: [0.9176, 0.9569, 1, 1], // #EAF4FF — Key Highlight
  specColor: [0.8627, 0.9176, 1, 1], // #DCEAFF — Fill Highlight
  canvasColor: [0, 0, 0, 0], // transparente: el orbe flota sobre la UI
  glowColor: [0.6196, 0.549, 1, 1], // #9E8CFF
  paletteStop0: [0, 0, 0, 0],
  paletteStop1: [0, 0, 0, 0],
  paletteStop2: [0, 0, 0, 0],
  paletteStop3: [0, 0, 0, 0],
  paletteStop4: [0, 0, 0, 0],
  paletteStop5: [0, 0, 0, 0],
  paletteStop6: [0, 0, 0, 0],
  paletteStop7: [0, 0, 0, 0],
  paletteStop8: [0, 0, 0, 0],
  paletteStop9: [0, 0, 0, 0],
  paletteStop10: [0, 0, 0, 0],
  paletteStop11: [0, 0, 0, 0],
};

const SCALAR_COUNT = Object.keys(SCALARS).length;

/** Number of f32 the uniform buffer holds. */
export const UNIFORM_FLOAT_COUNT = SCALAR_COUNT + Object.keys(VECTORS).length * 4;

/** Indices the render loop overwrites each frame. */
export const U_SIZE_X = 0;
export const U_SIZE_Y = 1;
export const U_TIME = 2;
export const U_SPEED = 3;

export const UNIFORM_SEED: number[] = [
  ...Object.values(SCALARS),
  ...Object.values(VECTORS).flat(),
];

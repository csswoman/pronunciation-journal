/** Curated local flow programs, part 2: chromatic brushed metal, opal, frost, voice membrane, blue drop, violet ember, and the style dispatcher. See liquid-orb-shader.ts for section order. */
export const LIQUID_ORB_WGSL_PRESETS_B = /* wgsl */ `
fn glsChromaticMetalPhase(p: vec2<f32>, t: f32) -> f32 {
  let angle = u.metalAngle * 0.01745329252;
  let scale = max(u.metalScale, 0.05);
  let stretch = mix(0.48, 1.58, clamp(u.metalStretch, 0.0, 1.0));
  var q = glsRotate(p / scale, angle);
  q = vec2<f32>(q.x / stretch, q.y * stretch);

  let cycle = t * 0.46 + u.metalPhase * 6.28318530718;
  let evolution = clamp(u.metalEvolution, 0.0, 2.0);
  q.x = q.x + sin(q.y * 1.86 - cycle) * 0.095 * evolution;
  q.x = q.x + sin((q.x + q.y) * 1.28 + cycle * 2.0 + 1.4) * 0.045 * evolution;
  q.y = q.y + sin(q.x * 1.52 + cycle + 0.8) * 0.07 * evolution;

  let repeats = max(u.bandDensity, 1.0);
  return q.x * repeats * 2.18
       + sin(q.y * (1.3 + repeats * 0.26) - cycle) * 0.56 * evolution
       + sin((q.x - q.y) * 1.34 + cycle * 2.0 + 1.7) * 0.27 * evolution
       + sin((q.x * 0.72 + q.y) * 2.1 - cycle * 3.0 + 0.35) * 0.11 * evolution
       + sin(cycle) * 0.1
       + sin(cycle * 3.0 + 0.7) * 0.035
       + cycle
       + u.metalOffset * 6.28318530718;
}

fn glsChromaticMetalTone(phase: f32) -> f32 {
  let wave = 0.5 + 0.5 * cos(phase);
  let roughness = clamp(u.metalRoughness, 0.0, 1.0);
  let depth = clamp(u.metalDepth, 0.0, 1.0);
  let edge = 0.025 + roughness * 0.18;
  let broadReflection = smoothstep(0.5 - edge, 0.5 + edge, wave);
  let hardReflection = pow(wave, mix(13.0, 4.0, roughness));
  let blackFold = pow(1.0 - wave, mix(9.0, 3.0, roughness));
  let body = mix(wave, broadReflection, 0.2 + depth * 0.3);
  return clamp(0.018 + body * (0.46 + depth * 0.12)
               + hardReflection * (0.3 + depth * 0.42)
               - blackFold * (0.07 + depth * 0.11), 0.0, 1.0);
}

fn glsChromaticMetalSample(p: vec2<f32>, t: f32) -> vec3<f32> {
  let phase = glsChromaticMetalPhase(p, t);
  let angle = u.metalAngle * 0.01745329252;
  let brushP = glsRotate(p / max(u.metalScale, 0.05), angle);
  let brushed = sin(brushP.y * 146.0 + sin(brushP.x * 11.0) * 0.58)
              + 0.48 * sin(brushP.y * 317.0 - brushP.x * 5.0);
  let brushAmount = 0.004 + clamp(u.metalRoughness, 0.0, 1.0) * 0.014;
  let tone = clamp(glsChromaticMetalTone(phase) + brushed * brushAmount, 0.0, 1.0);
  return lqRamp(tone, u.colorD.rgb, u.colorB.rgb, u.colorC.rgb, u.colorA.rgb);
}

fn glsChromaticMetalFluid(p: vec2<f32>, t: f32) -> vec3<f32> {
  let angle = u.metalAngle * 0.01745329252;
  let splitDirection = glsRotate(vec2<f32>(0.0, 1.0), angle);
  let split = splitDirection * u.chromaticShift * 0.045;
  let redSample = glsChromaticMetalSample(p + split, t);
  let neutral = glsChromaticMetalSample(p, t);
  let blueSample = glsChromaticMetalSample(p - split, t);
  let optical = vec3<f32>(redSample.r, neutral.g, blueSample.b);
  let fringe = clamp(length(optical - neutral) * 4.0, 0.0, 1.0);
  var color = mix(neutral, optical,
                  clamp(u.chromaticShift * (0.72 + fringe * 0.28), 0.0, 1.0));
  let centerTone = glsChromaticMetalTone(glsChromaticMetalPhase(p, t));
  let glint = pow(centerTone, mix(12.0, 5.0, clamp(u.metalRoughness, 0.0, 1.0)));
  color = mix(color, u.highlightColor.rgb,
              glint * clamp(u.metalDepth, 0.0, 1.0) * 0.06);

  let radial2 = clamp(dot(p, p), 0.0, 1.0);
  let normal = normalize(vec3<f32>(p, sqrt(max(1.0 - radial2, 0.0))));
  let roughness = clamp(u.metalRoughness, 0.0, 1.0);
  let depth = clamp(u.metalDepth, 0.0, 1.0);
  let key = pow(max(dot(normal, normalize(vec3<f32>(-0.48, 0.62, 0.62))), 0.0),
                mix(7.0, 3.0, roughness));
  let fill = pow(max(dot(normal, normalize(vec3<f32>(0.7, -0.34, 0.63))), 0.0),
                 mix(10.0, 4.0, roughness));
  let limb = 1.0 - normal.z;
  let fresnel = pow(limb, 3.0);
  let rim = pow(limb, 10.0);
  color = color * (0.86 + normal.z * 0.14);
  color = mix(color, u.highlightColor.rgb, key * (0.05 + depth * 0.13));
  color = mix(color, u.colorC.rgb, fill * (0.025 + depth * 0.07));
  color = mix(color, u.colorD.rgb, fresnel * (0.12 + depth * 0.15));
  color = mix(color, u.highlightColor.rgb, rim * (0.035 + depth * 0.055));
  return glsFinishPresetFluid(color, p);
}

fn glsOpalFluid(p: vec2<f32>, t: f32) -> vec3<f32> {
  let q = p * (0.8 + u.zoom * 0.64);
  let complexity = 0.76 + u.warp * 0.085;
  var d = -t * 0.42;
  var a = 0.0;
  for (var i: i32 = 0; i < 8; i = i + 1) {
    let fi = f32(i);
    a = a + cos(fi - d - a * q.x * complexity);
    d = d + sin(q.y * fi * complexity + a);
  }
  d = d + t * 0.42;
  let c1 = cos(q * vec2<f32>(d, a)) * 0.6 + vec2<f32>(0.4);
  let c2 = cos(a + d) * 0.5 + 0.5;
  let interference = 0.5 + 0.5 * cos(vec3<f32>(c1.x, c1.y, c2)
                         * cos(vec3<f32>(d, a, 2.5)) * 0.5 + vec3<f32>(0.5));
  let tone = fract(interference.r * 0.37 + interference.g * 0.51
                   + interference.b * 0.73 + c1.x * 0.22 - c1.y * 0.15);
  var color = lqRamp(tone, u.colorB.rgb, u.colorC.rgb, u.colorD.rgb, u.colorA.rgb);
  color = mix(color, u.colorA.rgb, 0.16 + 0.1 * interference.b);
  color = color / (vec3<f32>(1.0) + color * 0.16);
  return glsFinishPresetFluid(color, p);
}

fn glsFrostFluid(p: vec2<f32>, t: f32) -> vec3<f32> {
  var q = p * (0.66 + u.zoom * 0.92);
  q.y = q.y + t * 0.055;
  let blur = 0.011 + 0.006 * u.zoom;
  let warpField = vec2<f32>(
    lqFbm(q * 1.14 + vec2<f32>(t * 0.055, 0.0), blur).x,
    lqFbm(q * 1.14 + vec2<f32>(6.8, -t * 0.048), blur).x
  );
  let warped = q + (warpField - vec2<f32>(0.5)) * (0.28 + u.warp * 0.17);
  let body = lqFbm(warped * 1.48 + vec2<f32>(t * 0.032, -t * 0.02), blur * 1.48);
  let veins = lqRidgeS(
    lqFbm(warped * 2.36 + vec2<f32>(3.1, -t * 0.024), blur * 2.36),
    u.sharp
  );
  let value = mix(lqStepS(body, 0.1, 0.9),
                  clamp(veins * 0.8 + body.x * 0.46, 0.0, 1.0),
                  u.ridgeAmt);
  var color = lqRamp(value, u.colorA.rgb, u.colorB.rgb, u.colorC.rgb, u.colorD.rgb);
  color = mix(color, u.colorA.rgb, 0.08 * smoothstep(0.62, 0.92, body.x));
  return glsFinishPresetFluid(color, p);
}

fn glsVoiceWaveFluid(p: vec2<f32>, t: f32) -> vec3<f32> {
  let scale = 0.76 + u.zoom * 0.34;
  let q = p / scale;
  let rimEnvelope = pow(max(1.0 - q.x * q.x, 0.0), 0.72);
  let drift = t * 0.82;
  let amplitude = 0.2 + u.warp * 0.018;
  let mainY = rimEnvelope * (amplitude * sin(q.x * 1.48 + drift)
              + 0.055 * sin(q.x * 3.2 - drift * 0.43 + 1.1));
  let distance = q.y - mainY;
  let width = 0.11 + (1.0 - u.ridgeAmt) * 0.075;
  let membrane = exp(-distance * distance / max(width * width, 0.001)) * rimEnvelope;
  let upperVeil = exp(-(distance - 0.105) * (distance - 0.105)
                      / max(width * width * 2.4, 0.001)) * rimEnvelope;
  let lowerVeil = exp(-(distance + 0.115) * (distance + 0.115)
                      / max(width * width * 2.8, 0.001)) * rimEnvelope;
  let crest = exp(-distance * distance / 0.0026) * rimEnvelope;
  let depth = sqrt(max(1.0 - clamp(dot(p, p), 0.0, 1.0), 0.0));
  var color = mix(u.colorA.rgb * 0.7, u.colorD.rgb * 0.34,
                  smoothstep(-0.82, 0.82, q.y));
  color = mix(color, u.colorB.rgb, upperVeil * 0.7);
  color = mix(color, u.colorC.rgb, lowerVeil * 0.62);
  color = color + mix(u.colorB.rgb, u.colorC.rgb, 0.46) * membrane * 0.34;
  color = color + u.highlightColor.rgb * crest * 0.14;
  color = color * (0.58 + 0.42 * depth);
  return glsFinishPresetFluid(color, p);
}

fn glsBlueDropFluid(p: vec2<f32>, t: f32) -> vec3<f32> {
  let depth = sqrt(max(1.0 - clamp(dot(p, p), 0.0, 1.0), 0.0));
  var q = p * mix(0.72, 1.0, depth * 0.62 + 0.38);
  q = glsRotate(q, -0.24 + 0.06 * sin(t * 0.17));
  let scale = 1.0 + u.zoom * 1.12;
  let blur = 0.012 + 0.006 * u.zoom;
  let driftA = lqFbm(q * 1.28 + vec2<f32>(t * 0.095, -t * 0.034), blur * 1.28);
  let driftB = lqFbm(glsRotate(q, 1.08) * 1.62
                     + vec2<f32>(-t * 0.042, t * 0.078), blur * 1.62);
  var flowed = q + vec2<f32>(driftA.x - 0.5, driftB.x - 0.5)
                 * (0.24 + u.warp * 0.1);
  flowed.x = flowed.x + sin(flowed.y * 2.15 + t * 0.24) * (0.035 + u.warp * 0.012);
  flowed.y = flowed.y + sin(flowed.x * 1.38 - t * 0.18) * (0.045 + u.warp * 0.01);
  let body = lqFbm(flowed * scale + vec2<f32>(t * 0.025, -t * 0.018), blur * scale);
  let marble = lqRidgeS(lqFbm(flowed * (1.72 + u.zoom * 0.9)
                              + vec2<f32>(2.7, -t * 0.035),
                              blur * (1.72 + u.zoom * 0.9)),
                            0.8 + u.sharp * 0.46);
  let value = clamp(mix(body.x, body.x * 0.62 + marble * 0.58, u.ridgeAmt), 0.0, 1.0);
  var color = lqRamp(value, u.colorA.rgb, u.colorB.rgb, u.colorC.rgb, u.colorD.rgb);
  let light = pow(max(dot(normalize(vec3<f32>(p, depth)),
                          normalize(vec3<f32>(-0.48, 0.62, 0.92))), 0.0), 3.2);
  color = mix(color, u.highlightColor.rgb, light * (0.035 + 0.05 * u.shade));
  color = color * (0.74 + 0.26 * depth);
  return glsFinishPresetFluid(color, p);
}

fn glsVioletEmberFluid(p: vec2<f32>, t: f32) -> vec3<f32> {
  let scale = 1.08 + u.zoom * 1.18;
  let blur = 0.011 + 0.005 * u.zoom;
  let radius = length(p);
  let twist = t * 0.055 + radius * (0.72 + u.warp * 0.11)
              + 0.08 * sin(t * 0.31 + radius * 4.0);
  let q = glsRotate(p * scale, twist);
  let low = lqFbm(q * 1.18 + vec2<f32>(t * 0.068, -t * 0.105), blur * 1.18);
  let cross = lqFbm(glsRotate(q, -1.12) * 1.52
                    + vec2<f32>(-t * 0.094, t * 0.042)
                    + vec2<f32>(low.x * 1.35, -low.x * 0.72), blur * 1.52);
  let warped = q + vec2<f32>(low.x - 0.5, cross.x - 0.5)
                   * (0.3 + u.warp * 0.12);
  let melt = lqFbm(warped * 1.34
                   + vec2<f32>(cross.x * 1.48, low.x * 1.12), blur * 1.34);
  let veins = lqRidgeS(lqFbm(warped * (2.05 + u.zoom * 0.72)
                             + vec2<f32>(-2.1, t * 0.052),
                             blur * (2.05 + u.zoom * 0.72)),
                           0.82 + u.sharp * 0.58);
  let heat = smoothstep(0.18, 0.92,
                        melt.x * (0.72 - u.ridgeAmt * 0.16)
                        + veins * (0.32 + u.ridgeAmt * 0.5));
  var color = lqRamp(heat, u.colorA.rgb, u.colorB.rgb, u.colorC.rgb, u.colorD.rgb);
  let pulse = 0.94 + 0.06 * sin(t * 0.44 + melt.x * 5.0);
  color = color * pulse;
  color = mix(color, u.highlightColor.rgb, pow(veins, 4.0) * 0.045);
  return glsFinishPresetFluid(color, p);
}

fn glsPresetFluid(p: vec2<f32>, style: i32, t: f32) -> vec3<f32> {
  if (style == 9) { return glsSiriFluid(p, t); }
  if (style == 10) { return glsAuroraFluid(p, t); }
  if (style == 11) { return glsPlasmaFluid(p, t); }
  if (style == 12) { return glsChromeFluid(p, t); }
  if (style == 13) { return glsOpalFluid(p, t); }
  if (style == 14) { return glsSpectrumFluid(p, t); }
  if (style == 15) { return glsFrostFluid(p, t); }
  if (style == 19) { return glsVoiceWaveFluid(p, t); }
  if (style == 20) { return glsBlueDropFluid(p, t); }
  if (style == 21) { return glsVioletEmberFluid(p, t); }
  if (style == 22) { return glsChromaticMetalFluid(p, t); }
  return glsFrostFluid(p, t);
}
`;

import { describe, expect, it } from "vitest";
import { LIQUID_ORB_WGSL } from "@/lib/ai-coach/liquid-orb-shader";
import { UNIFORM_FLOAT_COUNT, UNIFORM_SEED } from "@/lib/ai-coach/liquid-orb-seed";

type UniformFieldType = "f32" | "vec2<f32>" | "vec4<f32>";

const FIELD_FLOATS: Record<UniformFieldType, number> = {
  "f32": 1,
  "vec2<f32>": 2,
  "vec4<f32>": 4,
};

/** The field list of `struct Uniforms`, excluding every other struct in the file. */
function uniformFields(): UniformFieldType[] {
  const block = LIQUID_ORB_WGSL.match(/struct Uniforms \{([\s\S]*?)\n\};/);
  if (!block) throw new Error("struct Uniforms not found in the shader source");
  return [...block[1].matchAll(/^\s+\w+:\s+(vec2<f32>|vec4<f32>|f32),/gm)].map(
    (m) => m[1] as UniformFieldType,
  );
}

describe("liquid orb WGSL", () => {
  it("has no line-continuation backslashes that would collapse statements", () => {
    // A trailing `\` inside a JS template literal eats the newline, silently
    // fusing two WGSL lines and making the shader fail to compile at runtime.
    expect(LIQUID_ORB_WGSL).not.toMatch(/\\\n/);
  });

  it("survived the template literal with its escapes intact", () => {
    // A stray backtick or ${ inside the WGSL would have terminated or
    // interpolated the template literal at build time; if the source still
    // holds the whole shader, the escaping is right.
    expect(LIQUID_ORB_WGSL.length).toBeGreaterThan(20_000);
    expect(LIQUID_ORB_WGSL.trimEnd().endsWith("}")).toBe(true);
  });

  it("is structurally balanced and exposes both entry points", () => {
    const balance = (open: string, close: string) =>
      LIQUID_ORB_WGSL.split(open).length - LIQUID_ORB_WGSL.split(close).length;

    expect(balance("{", "}")).toBe(0);
    expect(balance("(", ")")).toBe(0);
    expect(LIQUID_ORB_WGSL).toContain("fn vs_main");
    expect(LIQUID_ORB_WGSL).toContain("fn fs_main");
  });

  it("seeds exactly as many floats as struct Uniforms declares", () => {
    const required = uniformFields().reduce((total, field) => total + FIELD_FLOATS[field], 0);

    expect(UNIFORM_SEED).toHaveLength(required);
    expect(UNIFORM_FLOAT_COUNT).toBe(required);
  });

  it("keeps the scalar block 16-byte aligned so the colours need no padding", () => {
    const fields = uniformFields();
    const firstVec4 = fields.indexOf("vec4<f32>");
    const scalarFloats = fields
      .slice(0, firstVec4)
      .reduce((total, field) => total + (field === "vec2<f32>" ? 2 : 1), 0);

    expect(scalarFloats % 4).toBe(0);
  });

  it("writes premultiplied alpha, matching the canvas alphaMode", () => {
    expect(LIQUID_ORB_WGSL).toContain("vec4<f32>(c.rgb * alpha, alpha)");
  });

  it("masks the orb with a circle, never a square", () => {
    // A Chebyshev distance — max(abs(x), abs(y)) — clips the disc's sides flat
    // and makes the orb read as a rounded square. Comments are stripped first
    // so that describing the trap does not count as falling into it.
    const code = LIQUID_ORB_WGSL.replace(/\/\/[^\n]*/g, "");
    expect(code).not.toMatch(/max\(abs\([^)]*\), abs\([^)]*\)\)/);
  });
});

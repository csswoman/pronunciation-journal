import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Dual @supabase/postgrest-js copies (orphaned top-level 2.102.x + nested
 * 2.108.x) make webpack interop exports undefined — browser queries then throw
 * `Cannot read properties of undefined (reading 'M_ID')`.
 */
describe("supabase dependency resolution", () => {
  it("resolves a single postgrest-js version from supabase-js", () => {
    const require = createRequire(import.meta.url);
    const supabaseJsPkg = require.resolve("@supabase/supabase-js/package.json");
    const fromSupabaseJs = createRequire(supabaseJsPkg);
    const postgrestPkg = fromSupabaseJs.resolve(
      "@supabase/postgrest-js/package.json",
    );
    const version = fromSupabaseJs(postgrestPkg).version as string;

    expect(version).toMatch(/^2\./);
    expect(postgrestPkg.replace(/\\/g, "/")).toContain(
      `@supabase+postgrest-js@${version}`,
    );
  });

  it("does not leave an orphaned physical top-level postgrest-js", () => {
    const top = path.join(
      process.cwd(),
      "node_modules",
      "@supabase",
      "postgrest-js",
    );
    if (!fs.existsSync(top)) return;

    const stat = fs.lstatSync(top);
    // pnpm should expose a symlink/junction into .pnpm — never a plain copy.
    expect(stat.isSymbolicLink()).toBe(true);
  });
});

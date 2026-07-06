import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("stt_transcription_cache RLS migrations", () => {
  it("scopes cache per user with authenticated policies", () => {
    const migrationPath = path.join(
      process.cwd(),
      "supabase/migrations/20260621140000_stt_cache_scope_per_user.sql",
    );
    const sql = fs.readFileSync(migrationPath, "utf8");

    expect(sql).toMatch(/alter column user_id set not null/i);
    expect(sql).toMatch(/users can read own stt cache/i);
    expect(sql).toMatch(/users can insert own stt cache/i);
    expect(sql).toMatch(/auth\.uid\(\) = user_id/i);
  });
});

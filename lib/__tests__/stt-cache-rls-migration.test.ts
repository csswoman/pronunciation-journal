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

  it("removes legacy global policies after the per-user rollout", () => {
    const migrationPath = path.join(
      process.cwd(),
      "supabase/migrations/20260718014511_consolidate_rls_and_retire_skill_profile.sql",
    );
    const sql = fs.readFileSync(migrationPath, "utf8");

    expect(sql).toMatch(/drop policy if exists "stt_cache_select"/i);
    expect(sql).toMatch(/drop policy if exists "authenticated users can read stt cache"/i);
    expect(sql).toMatch(/drop function if exists public\.get_skill_profile\(uuid\)/i);
    expect(sql).toMatch(/revoke insert, update, delete.*deck_suggestions_cache/i);
  });
});

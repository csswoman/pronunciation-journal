import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("User Profiles and Role Security Migration Audit", () => {
  const migrationsDir = path.join(process.cwd(), "supabase", "migrations");
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  it("includes migration securing user_profiles and isolating user_roles", () => {
    const hardeningMigration = migrationFiles.find((f) =>
      f.includes("secure_user_profiles_and_roles"),
    );
    expect(hardeningMigration).toBeDefined();

    const sql = fs.readFileSync(path.join(migrationsDir, hardeningMigration!), "utf8");

    // Table user_roles created with RLS enabled
    expect(sql).toMatch(/create\s+table\s+(?:if\s+not\s+exists\s+)?public\.user_roles/i);
    expect(sql).toMatch(/alter\s+table\s+public\.user_roles\s+enable\s+row\s+level\s+security/i);

    // user_roles revoked from anon and authenticated
    expect(sql).toMatch(/revoke\s+all\s+on\s+table\s+public\.user_roles\s+from\s+anon,\s*authenticated/i);

    // is_admin function uses app_metadata / user_roles and not user_profiles.role
    expect(sql).toMatch(/create\s+or\s+replace\s+function\s+public\.is_admin/i);
    expect(sql).toMatch(/auth\.jwt\(\)\s*->\s*'app_metadata'\s*->>\s*'role'/i);

    // user_profiles column-level grants restrict INSERT/UPDATE to non-privileged columns
    expect(sql).toMatch(/grant\s+insert\s*\(\s*id,\s*display_name,\s*cefr_level,\s*interests\s*\)/i);
    expect(sql).toMatch(/grant\s+update\s*\(\s*display_name,\s*cefr_level,\s*interests\s*\)/i);

    // Trigger installed to block privilege escalation
    expect(sql).toMatch(/create\s+(?:or\s+replace\s+)?trigger\s+tr_protect_user_profiles_privileged_columns/i);

    // Dependent policies must tolerate retired/missing tables (e.g. ai_prompts).
    expect(sql).toMatch(/to_regclass\('public\.ai_prompts'\)/i);
    expect(sql).toMatch(/to_regclass\('public\.decks'\)/i);
  });

  it("does not backfill user_roles from the previously client-writable user_profiles.role", () => {
    const hardeningMigration = migrationFiles.find((f) =>
      f.includes("secure_user_profiles_and_roles"),
    );
    expect(hardeningMigration).toBeDefined();
    const sql = fs.readFileSync(path.join(migrationsDir, hardeningMigration!), "utf8");
    // Strip SQL line comments so documented seed examples do not false-positive.
    const executableSql = sql
      .split("\n")
      .filter((line) => !line.trimStart().startsWith("--"))
      .join("\n");

    expect(executableSql).not.toMatch(
      /insert\s+into\s+public\.user_roles[\s\S]*from\s+public\.user_profiles/i,
    );
    expect(executableSql).not.toMatch(
      /insert\s+into\s+public\.user_roles/i,
    );
    expect(sql).toMatch(/Do NOT backfill public\.user_roles from user_profiles\.role/i);
  });
});

describe("Storage bucket policy migration audit", () => {
  const migrationsDir = path.join(process.cwd(), "supabase", "migrations");

  it("namespaces avatars and word-images by auth.uid and blocks anonymous writers", () => {
    const storageMigration = fs
      .readdirSync(migrationsDir)
      .find((f) => f.includes("storage_buckets_and_policies"));
    expect(storageMigration).toBeDefined();

    const sql = fs.readFileSync(path.join(migrationsDir, storageMigration!), "utf8");

    expect(sql).toMatch(/'avatars'/);
    expect(sql).toMatch(/'word-images'/);
    expect(sql).toMatch(/\(storage\.foldername\(name\)\)\[1\]\s*=\s*auth\.uid\(\)::text/);
    expect(sql).toMatch(
      /coalesce\(\(auth\.jwt\(\)\s*->>\s*'is_anonymous'\)::boolean,\s*false\)\s*=\s*false/,
    );
    expect(sql).toMatch(/file_size_limit/);
    expect(sql).toMatch(/allowed_mime_types/);
  });
});

describe("Progress projection aggregate RPC migration audit", () => {
  const migrationsDir = path.join(process.cwd(), "supabase", "migrations");

  it("defines get_activity_totals and get_lesson_completion_total scoped to auth.uid, invoker-mode, NULL-safe", () => {
    const aggregatesMigration = fs
      .readdirSync(migrationsDir)
      .find((f) => f.includes("progress_projection_aggregates"));
    expect(aggregatesMigration).toBeDefined();

    const sql = fs.readFileSync(path.join(migrationsDir, aggregatesMigration!), "utf8");

    // Both functions exist
    expect(sql).toMatch(/create\s+or\s+replace\s+function\s+public\.get_activity_totals/i);
    expect(sql).toMatch(/create\s+or\s+replace\s+function\s+public\.get_lesson_completion_total/i);

    // Both scope by (select auth.uid()) — not a client-supplied user_id parameter
    expect(sql).toMatch(/where\s+user_id\s*=\s*\(select\s+auth\.uid\(\)\)/i);
    const authUidScopeCount = (sql.match(/\(select\s+auth\.uid\(\)\)/gi) ?? []).length;
    expect(authUidScopeCount).toBe(2);

    // Neither function is marked security definer (invoker-mode, the Postgres default)
    expect(sql).not.toMatch(/security\s+definer/i);

    // Both sum() calls are NULL-safe on zero rows
    expect(sql).toMatch(/coalesce\(\s*sum\(exercises_total\)\s*,\s*0\s*\)/i);
    expect(sql).toMatch(/coalesce\(\s*sum\(duration_ms\)\s*,\s*0\s*\)/i);

    // Both functions are granted to authenticated
    expect(sql).toMatch(
      /grant\s+execute\s+on\s+function\s+public\.get_activity_totals\(\)\s+to\s+authenticated/i,
    );
    expect(sql).toMatch(
      /grant\s+execute\s+on\s+function\s+public\.get_lesson_completion_total\(\)\s+to\s+authenticated/i,
    );
  });
});

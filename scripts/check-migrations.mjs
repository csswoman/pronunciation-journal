import fs from "node:fs";
import path from "node:path";

const MIGRATIONS_DIR = path.join(process.cwd(), "supabase", "migrations");
const ALLOWED_LEGACY_FILES = new Set([
  "supabase/migrations/20260329230234_remote_schema.sql",
  "supabase/migrations/20260602000000_seed_text_fragments_sentences.sql",
  "supabase/migrations/20260623000000_remove_premium_set_admin_and_a1.sql",
]);

function readSqlFiles(dir) {
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".sql"))
    .sort()
    .map((file) => path.join(dir, file));
}

function hasHardcodedEmail(sql) {
  return /(?:email|mail)\s*[:=]\s*['"][^'"\n@]+@[^'"\n]+\.[^'"\n]+['"]/i.test(sql);
}

function hasMassDelete(sql) {
  return /delete\s+from\s+[\w."`]+\s*(?:;|$)/i.test(sql) && !/where\s+/i.test(sql);
}

function hasOpenGrant(sql) {
  return (
    /grant\s+all\s+on\s+(?:table|tables|schema|function|functions)\b/i.test(sql) ||
    (/grant\s+\w+\s+on\s+\w+/i.test(sql) && /to\s+public\b/i.test(sql))
  );
}

function hasDropPolicy(sql) {
  return /drop\s+policy\b/i.test(sql);
}

function hasReplacementPolicy(sql) {
  return /create\s+policy\b/i.test(sql);
}

const issues = [];

for (const file of readSqlFiles(MIGRATIONS_DIR)) {
  const sql = fs.readFileSync(file, "utf8");
  const relative = path.relative(process.cwd(), file).replace(/\\/g, "/");

  if (ALLOWED_LEGACY_FILES.has(relative)) {
    continue;
  }

  if (hasHardcodedEmail(sql)) {
    issues.push(`${relative}: hardcoded email literal detected`);
  }

  if (hasMassDelete(sql)) {
    issues.push(`${relative}: mass DELETE without WHERE detected`);
  }

  if (hasOpenGrant(sql)) {
    issues.push(`${relative}: broad GRANT detected`);
  }

  if (hasDropPolicy(sql) && !hasReplacementPolicy(sql)) {
    issues.push(`${relative}: DROP POLICY without CREATE POLICY replacement detected`);
  }
}

if (issues.length > 0) {
  console.error("Migration safety check failed:");
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log(`Checked ${readSqlFiles(MIGRATIONS_DIR).length} migration files. No high-risk patterns found.`);

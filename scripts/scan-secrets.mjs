import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SCANNED_EXTENSIONS = new Set([
  ".cjs",
  ".css",
  ".env",
  ".example",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mjs",
  ".sql",
  ".ts",
  ".tsx",
  ".yml",
  ".yaml",
]);

const SKIPPED_FILES = new Set(["pnpm-lock.yaml", "package-lock.json"]);
const SKIPPED_DIRS = [".git/", ".next/", "coverage/", "node_modules/", "public/sw.js", "public/workbox-"];

const ALLOWED_VALUE_PATTERNS = [
  /^$/,
  /^<[^>]+>$/,
  /^\$\{\{\s*secrets\.[A-Z0-9_]+\s*\}\}$/,
  /^\$\{\{\s*secrets\.[A-Z0-9_]+\s*\|\|\s*['"][^'"]+['"]\s*\}\}$/,
  /^ci-[a-z0-9-]+$/i,
  /^[a-z0-9-]+\.invalid$/i,
  /^[a-z0-9-]*placeholder[a-z0-9-]*$/i,
  /^[a-z0-9-]*example[a-z0-9-]*$/i,
  /^service-role$/i,
  /^[a-z0-9-]*test[a-z0-9-]*$/i,
  /^your[-_a-z0-9]*$/i,
];

const SECRET_ASSIGNMENT =
  /\b([A-Z0-9_]*(?:API[_-]?KEY|SECRET|TOKEN|PRIVATE[_-]?KEY|SERVICE[_-]?ROLE[_-]?KEY|ACCESS[_-]?KEY|CLIENT[_-]?SECRET|WEBHOOK[_-]?SECRET)[A-Z0-9_]*)\b\s*[:=]\s*["']([^"'\n]{12,})["']/gi;

const PATTERNS = [
  { name: "Google API key", regex: /AIza[0-9A-Za-z_-]{30,}/g },
  { name: "Supabase JWT-like key", regex: /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/g },
  { name: "OpenAI API key", regex: /sk-[A-Za-z0-9_-]{32,}/g },
  { name: "Private key block", regex: /-----BEGIN (?:RSA |EC |OPENSSH |)?PRIVATE KEY-----/g },
];

function trackedFiles() {
  return execFileSync("git", ["ls-files"], { cwd: ROOT, encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean);
}

function shouldScan(file) {
  const normalized = file.replace(/\\/g, "/");
  if (SKIPPED_FILES.has(normalized)) return false;
  if (SKIPPED_DIRS.some((prefix) => normalized.startsWith(prefix))) return false;

  const ext = path.extname(normalized);
  return SCANNED_EXTENSIONS.has(ext) || normalized.includes(".env");
}

function isAllowedValue(value) {
  return ALLOWED_VALUE_PATTERNS.some((pattern) => pattern.test(value.trim()));
}

function lineNumberFor(content, index) {
  return content.slice(0, index).split(/\r?\n/).length;
}

const findings = [];

for (const file of trackedFiles().filter(shouldScan)) {
  const fullPath = path.join(ROOT, file);
  // git ls-files includes index entries for unstaged deletions.
  if (!fs.existsSync(fullPath)) continue;

  const content = fs.readFileSync(fullPath, "utf8");

  for (const match of content.matchAll(SECRET_ASSIGNMENT)) {
    const [, name, value] = match;
    if (isAllowedValue(value)) continue;

    findings.push({
      file,
      line: lineNumberFor(content, match.index ?? 0),
      type: `secret assignment (${name})`,
    });
  }

  for (const pattern of PATTERNS) {
    for (const match of content.matchAll(pattern.regex)) {
      findings.push({
        file,
        line: lineNumberFor(content, match.index ?? 0),
        type: pattern.name,
      });
    }
  }
}

if (findings.length > 0) {
  console.error("Secret scan failed:");
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line} ${finding.type}`);
  }
  process.exit(1);
}

console.log("Secret scan passed.");

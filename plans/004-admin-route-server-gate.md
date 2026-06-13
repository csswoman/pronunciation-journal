# Plan 004: Fix admin access gate — wrong role check in AdminLayout and missing server-side auth on seed mutations

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat b543c9a..HEAD -- app/admin/layout.tsx hooks/useUserRole.ts lib/admin/seed/services.ts lib/api/guards.ts`
> If any of those files changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; treat a
> mismatch as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/001-ci-gate-on-failures.md (verification baseline)
- **Category**: security
- **Planned at**: commit `b543c9a`, 2026-06-11

## Why this matters

There are two compounding gaps in the admin access control:

1. `app/admin/layout.tsx` checks `isPremium` — which is `role === "premium"` — instead of `role === "admin"`. Result: any premium user can navigate to `/admin/seed` and submit seed data. Actual admin-role users are locked out with "Access restricted".

2. `lib/admin/seed/services.ts` calls `getSupabaseBrowserClient()` directly — the seed mutations reach the database with only the anon key and whatever RLS policies exist on `sounds`, `words`, `patterns`, `pattern_words`, and `minimal_pairs`. Any logged-in user who calls the Supabase REST endpoint directly can insert rows if those policies are permissive.

The correct fix has two parts: (a) fix the layout check to use `role === "admin"`, and (b) move the seed mutations behind a server-side API route that verifies `role === "admin"` using the existing pattern already established in `app/api/gemini/route.ts`.

## Current state

### `hooks/useUserRole.ts`

- `export type UserRole = "free" | "premium" | "admin"` — the `admin` value exists in the type.
- Return statement: `return { role, loading, isPremium: role === "premium" }` — no `isAdmin` field.
- The hook reads from `user_profiles.role` via Supabase browser client.

### `app/admin/layout.tsx` — the bug

```tsx
"use client";
import { useUserRole } from "@/hooks/useUserRole";

export default function AdminLayout({ children }) {
  const { isPremium, loading } = useUserRole();   // BUG: should be isAdmin
  // ...
  if (!isPremium) {                               // BUG: checks premium, not admin
    return <AccessRestrictedUI />;
  }
  return <>{children}</>;
}
```

### `lib/admin/seed/services.ts` — all mutations go direct-to-Supabase

```ts
function supabase() {
  return getSupabaseBrowserClient();   // anon key, no server auth check
}
export async function insertSound(payload) {
  return supabase().from("sounds").insert(payload);
}
// Same for insertWord, insertPattern, insertPatternWord, insertMinimalPair
```

### `app/api/gemini/route.ts` lines 290–308 — the reference pattern

```ts
if (body.promptKey === "admin-seed") {
  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403, headers: SECURE_HEADERS });
  }
}
```

### `lib/api/guards.ts` — existing guard helpers

- `requireUser()` — verifies session, returns `{ user, error }`.
- No `requireAdmin()` yet — add it here.
- `SECURE_HEADERS` exported from here.
- `createSupabaseServerClient` already imported.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Type-check | `pnpm type-check` | exit 0, no errors |
| Lint | `pnpm lint` | exit 0 |
| Tests | `pnpm test` | all pass |
| Design tokens | `pnpm lint:design-tokens` | exit 0 |

## Scope

**In scope**:
- `hooks/useUserRole.ts` — add `isAdmin` return field
- `app/admin/layout.tsx` — switch gate from `isPremium` to `isAdmin`
- `lib/api/guards.ts` — add `requireAdmin()` helper
- `app/api/admin/seed/route.ts` — create new server route
- `lib/admin/seed/services.ts` — rewrite inserts to call the server route
- `app/api/admin/seed/route.test.ts` — create tests (new file)

**Out of scope**:
- `app/api/gemini/route.ts` — already correct, do not modify
- Any Supabase RLS policies
- Any UI changes beyond the one gate swap in the layout

## Git workflow

- Branch: `advisor/004-admin-route-server-gate`
- Commit style: `fix(admin): check admin role in layout and seed mutations`
- Do NOT push or open a PR unless instructed.

## Steps

### Step 1: Add `isAdmin` to `useUserRole`

In `hooks/useUserRole.ts`, change the return statement from:
```ts
return { role, loading, isPremium: role === "premium" };
```
to:
```ts
return { role, loading, isPremium: role === "premium", isAdmin: role === "admin" };
```

**Verify**: `pnpm type-check` → exit 0

### Step 2: Fix `AdminLayout` to check `isAdmin`

In `app/admin/layout.tsx`, change:
```tsx
const { isPremium, loading } = useUserRole();
// ...
if (!isPremium) {
```
to:
```tsx
const { isAdmin, loading } = useUserRole();
// ...
if (!isAdmin) {
```

**Verify**: `pnpm type-check` → exit 0; `pnpm lint` → exit 0

### Step 3: Add `requireAdmin()` to `lib/api/guards.ts`

After the existing `requireUser` export, add:

```ts
export type AdminAuthResult =
  | { user: User; error: null }
  | { user: null; error: NextResponse };

/**
 * Validates the session cookie and checks role === "admin" in user_profiles.
 * Returns 401 if unauthenticated, 403 if not admin.
 */
export async function requireAdmin(): Promise<AdminAuthResult> {
  const { user, error: authError } = await requireUser();
  if (authError) return { user: null, error: authError };

  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return {
      user: null,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403, headers: SECURE_HEADERS }),
    };
  }

  return { user, error: null };
}
```

`createSupabaseServerClient`, `User`, `NextResponse`, and `SECURE_HEADERS` are
already in scope in `guards.ts`.

**Verify**: `pnpm type-check` → exit 0

### Step 4: Create `app/api/admin/seed/route.ts`

Create the directory `app/api/admin/seed/` and the file `route.ts`.
The handler accepts a discriminated-union body identifying which table to write.

```ts
import { z } from "zod";
import { requireAdmin, SECURE_HEADERS } from "@/lib/api/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

const SoundSchema = z.object({ action: z.literal("insertSound"), payload: z.object({ ipa: z.string().max(20), type: z.enum(["vowel", "consonant"]), category: z.string().max(50).nullable(), example: z.string().max(100).nullable(), difficulty: z.number().int().min(1).max(5).nullable() }).strict() }).strict();
const WordSchema = z.object({ action: z.literal("insertWord"), payload: z.object({ word: z.string().max(100), ipa: z.string().max(50).nullable(), sound_id: z.number().int().nullable(), sound_focus: z.string().max(50).nullable(), difficulty: z.number().int().min(1).max(5).nullable(), audio_url: z.string().url().max(500).nullable() }).strict() }).strict();
const PatternSchema = z.object({ action: z.literal("insertPattern"), payload: z.object({ pattern: z.string().max(100), type: z.string().max(50).nullable(), sound_focus: z.string().max(50).nullable() }).strict() }).strict();
const PatternWordSchema = z.object({ action: z.literal("insertPatternWord"), payload: z.object({ pattern_id: z.number().int(), word: z.string().max(100), ipa: z.string().max(50).nullable() }).strict() }).strict();
const MinimalPairSchema = z.object({ action: z.literal("insertMinimalPair"), payload: z.object({ word_a: z.string().max(100), word_b: z.string().max(100), ipa_a: z.string().max(50).nullable(), ipa_b: z.string().max(50).nullable(), sound_group: z.string().max(50).nullable(), sound_a_id: z.number().int().nullable(), sound_b_id: z.number().int().nullable(), contrast_sound_a_id: z.number().int().nullable(), contrast_sound_b_id: z.number().int().nullable(), contrast_ipa_a: z.string().max(50).nullable(), contrast_ipa_b: z.string().max(50).nullable() }).strict() }).strict();

const SeedBodySchema = z.discriminatedUnion("action", [
  SoundSchema, WordSchema, PatternSchema, PatternWordSchema, MinimalPairSchema,
]);

const tableMap = {
  insertSound: "sounds",
  insertWord: "words",
  insertPattern: "patterns",
  insertPatternWord: "pattern_words",
  insertMinimalPair: "minimal_pairs",
} as const;

export async function POST(request: NextRequest): Promise<Response> {
  const { user, error } = await requireAdmin();
  if (error) return error;

  let raw: unknown;
  try { raw = await request.json(); }
  catch { return Response.json({ error: "Invalid JSON" }, { status: 400, headers: SECURE_HEADERS }); }

  const parsed = SeedBodySchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json({ error: "Invalid body", issues: parsed.error.issues }, { status: 400, headers: SECURE_HEADERS });
  }

  const supabase = await createSupabaseServerClient();
  const { action, payload } = parsed.data;
  const { error: dbError } = await supabase.from(tableMap[action] as never).insert(payload as never);

  if (dbError) {
    console.error("[admin/seed] db insert failed", { action, error: dbError });
    return Response.json({ error: dbError.message }, { status: 500, headers: SECURE_HEADERS });
  }

  return Response.json({ ok: true }, { status: 201, headers: SECURE_HEADERS });
}
```

Note: the `as never` casts are needed because the discriminated union payload
types are not automatically narrowed to Supabase's generated table types. Zod
schemas are the authoritative validation layer here.

**Verify**: `pnpm type-check` → exit 0

Before writing the Zod schemas, read `lib/admin/seed/services.ts` to verify
the actual payload shapes sent by the form components match these schemas.
If they differ, adjust the schemas to match before proceeding.

### Step 5: Rewrite insert functions in `lib/admin/seed/services.ts`

Add a shared helper at the top (after imports):

```ts
async function adminInsert(body: unknown): Promise<{ error: { message: string } | null }> {
  const res = await fetch("/api/admin/seed", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    return { error: { message: (json as { error?: string }).error ?? `HTTP ${res.status}` } };
  }
  return { error: null };
}
```

Then replace each insert function to use it:
```ts
export async function insertSound(payload: ...) {
  return adminInsert({ action: "insertSound", payload });
}
// ... same for insertWord, insertPattern, insertPatternWord, insertMinimalPair
```

Keep all read functions (`fetchSounds`, `fetchSoundsAndWords`, etc.) calling
Supabase directly — reads are allowed from the browser client.

Remove the `getSupabaseBrowserClient` import from this file only if it is
no longer used after the change (check reads vs. writes).

**Verify**: `pnpm type-check` → exit 0; `pnpm lint` → exit 0

### Step 6: Write route tests

Create `app/api/admin/seed/route.test.ts` with three cases:

1. **No session** — mock `requireUser` to return a 401 `NextResponse` → route returns 401.
2. **Authenticated but not admin** — mock `requireUser` to return a valid user, mock Supabase profile query to return `{ role: "premium" }` → route returns 403.
3. **Admin user, valid body** — mock `requireUser` to return valid user, mock profile to return `{ role: "admin" }`, mock Supabase insert to return `{ error: null }` → route returns 201 `{ ok: true }`.

**Verify**: `pnpm test` → all pass, including the 3 new tests

### Step 7: Full verification

```
pnpm type-check
pnpm lint
pnpm lint:design-tokens
pnpm test
```

## Test plan

- File: `app/api/admin/seed/route.test.ts`
- Cases listed in Step 6.
- Manual smoke test: log in as premium user, POST to `/api/admin/seed` directly → should receive 403.
- Manual smoke test: log in as admin user, navigate to `/admin/seed`, submit a sound form → should succeed.
- Manual smoke test: log in as premium user, navigate to `/admin/seed` → should see "Access restricted".

## Done criteria

- [ ] `pnpm type-check` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `pnpm lint:design-tokens` exits 0
- [ ] `pnpm test` exits 0; 3 new tests in `app/api/admin/seed/route.test.ts` pass
- [ ] `app/admin/layout.tsx`: `isPremium` no longer appears; `isAdmin` is used
- [ ] `hooks/useUserRole.ts`: return object includes `isAdmin: role === "admin"`
- [ ] `lib/admin/seed/services.ts`: no call to `getSupabaseBrowserClient()` in insert functions
- [ ] `app/api/admin/seed/route.ts` exists and calls `requireAdmin()`
- [ ] `lib/api/guards.ts` exports `requireAdmin`

## STOP conditions

- The `user_profiles` table does not have a `role` column or values are not `"admin"` / `"premium"` / `"free"` — check with `select distinct role from user_profiles limit 10` in Supabase SQL editor before starting.
- The Zod schemas in Step 4 don't cover all fields actually sent by the form components — read `lib/admin/seed/services.ts` and the tab hooks before writing the schemas.
- `pnpm type-check` fails after Step 4 due to Supabase generated type mismatches — report rather than cast around it.
- Any file outside the in-scope list needs modification — STOP.

## Maintenance notes

- `requireAdmin()` in `lib/api/guards.ts` should be reused by any future admin server route — do not inline the role check again.
- If `user_profiles.role` is ever renamed, both `useUserRole.ts` and `requireAdmin()` must be updated together.
- RLS policies on `sounds`, `words`, `patterns`, `pattern_words`, and `minimal_pairs` should be reviewed separately — this plan fixes the app layer only.

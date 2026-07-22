"use client";

/**
 * Guest-result transfer for the pronunciation diagnostic (plan 067, step 6).
 *
 * Mirrors `lib/courses/guest-assessment.ts`'s claim semantics exactly:
 *  1. Read the guest snapshot from localStorage; bail if missing/invalid.
 *  2. POST to the authenticated API route.
 *  3. Delete the guest snapshot ONLY after persistence succeeds. Never
 *     delete-then-persist — on any failure (network, non-ok response,
 *     thrown error) the guest snapshot is left untouched so the user
 *     doesn't lose their diagnostic.
 *  4. In-flight de-dupe via a userId-keyed promise map, so a reload that
 *     re-triggers the claim before the first attempt resolves doesn't fire
 *     a second concurrent POST.
 *
 * The POST body includes a client-generated `id`, so a genuine duplicate
 * submission (e.g. claim() called twice across reloads, each generating a
 * fresh promise) is idempotent server-side (see persistence-server.ts) —
 * this file does not need to persist the id anywhere itself.
 */

import { validateDiagnosticResult } from './schema'

const GUEST_DIAGNOSTIC_KEY = 'pronunciation-assessment:guest:diagnostic'
const claims = new Map<string, Promise<boolean>>()

function generateId(): string {
  return globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

async function claim(userId: string): Promise<boolean> {
  const raw = window.localStorage.getItem(GUEST_DIAGNOSTIC_KEY)
  if (!raw) return false

  try {
    const parsed: unknown = JSON.parse(raw)
    // The guest snapshot was captured before an account existed, so its
    // `userId` field (if present) is a placeholder. Overwrite it with the
    // real authenticated userId before validating/submitting — the schema
    // requires a non-empty userId and the API route rejects a mismatch.
    const candidate =
      typeof parsed === 'object' && parsed !== null ? { ...(parsed as Record<string, unknown>), userId } : parsed

    const validated = validateDiagnosticResult(candidate)
    if (!validated.ok) return false

    const response = await fetch('/api/pronunciation-assessment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: generateId(), result: validated.result }),
    })
    if (!response.ok) return false

    window.localStorage.removeItem(GUEST_DIAGNOSTIC_KEY)
    return true
  } catch {
    return false
  }
}

/** Claims a public pronunciation diagnostic result once a user is authenticated. */
export function claimGuestPronunciationDiagnostic(userId: string): Promise<boolean> {
  const existing = claims.get(userId)
  if (existing) return existing

  const pending = claim(userId).finally(() => claims.delete(userId))
  claims.set(userId, pending)
  return pending
}

/** Persists a completed diagnostic to localStorage for an unauthenticated (guest) user. */
export function saveGuestPronunciationDiagnostic(result: unknown): void {
  window.localStorage.setItem(GUEST_DIAGNOSTIC_KEY, JSON.stringify(result))
}

export { GUEST_DIAGNOSTIC_KEY }

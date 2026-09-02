/**
 * "Has this browser ever authenticated here before?"
 *
 * Drives which face of the login screen leads: a brand-new visitor sees the
 * guest-first pitch with the account block collapsed behind a link; someone who
 * has signed in before (or tried to) lands straight on the login form.
 *
 * Written on the first real auth attempt of any kind — guest, password, or
 * Google — so it is set before the user ever returns. Lives in localStorage so
 * it survives closing the browser; a cleared store just means the visitor is
 * treated as new again, which is the safe default.
 */
const RETURNING_KEY = "pj.auth.seen";

export function markAuthSeen(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RETURNING_KEY, "1");
  } catch {
    // Private mode / storage disabled — visitor stays "new", which is harmless.
  }
}

export function hasAuthedBefore(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(RETURNING_KEY) === "1";
  } catch {
    return false;
  }
}

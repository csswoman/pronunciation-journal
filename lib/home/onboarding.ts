/** Ephemeral first-visit UI prefs — not critical learning data. */
export const HOME_FIRST_SESSION_HINT_KEY = "home:first-session-hint-dismissed";

export function readFirstSessionHintDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(HOME_FIRST_SESSION_HINT_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissFirstSessionHint(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HOME_FIRST_SESSION_HINT_KEY, "1");
  } catch {
    /* quota / private mode */
  }
}

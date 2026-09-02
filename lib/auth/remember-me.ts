/**
 * "Recordarme" persistence.
 *
 * Supabase stores its session in localStorage by default, which survives
 * closing the browser. When the user unchecks "Recordarme" we want the session
 * to die with the tab, so the browser client swaps in a sessionStorage-backed
 * adapter. The choice itself must outlive the tab (so a later visit still knows
 * what was asked for) and therefore lives in localStorage under its own key.
 */
const REMEMBER_ME_KEY = "pj.auth.rememberMe";

export function setRememberMe(remember: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(REMEMBER_ME_KEY, remember ? "1" : "0");
  } catch {
    // Private mode / storage disabled — fall back to the default (remember).
  }
}

export function getRememberMe(): boolean {
  if (typeof window === "undefined") return true;
  try {
    // Default to true: a first-time visitor gets the conventional behaviour.
    return window.localStorage.getItem(REMEMBER_ME_KEY) !== "0";
  } catch {
    return true;
  }
}

/**
 * Storage adapter handed to createBrowserClient. Reads follow whichever store
 * currently holds the session so an existing login is never lost mid-session;
 * writes go to the store the user's choice selects.
 */
export function createRememberMeStorage(): {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
} {
  const preferred = () => (getRememberMe() ? window.localStorage : window.sessionStorage);

  return {
    getItem(key) {
      try {
        return window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key);
      } catch {
        return null;
      }
    },
    setItem(key, value) {
      try {
        const store = preferred();
        store.setItem(key, value);
        // Drop any copy left in the other store so the two never disagree.
        const other =
          store === window.localStorage ? window.sessionStorage : window.localStorage;
        other.removeItem(key);
      } catch {
        // Storage unavailable — the session stays in memory for this page only.
      }
    },
    removeItem(key) {
      try {
        window.localStorage.removeItem(key);
        window.sessionStorage.removeItem(key);
      } catch {
        // nothing to clean up
      }
    },
  };
}

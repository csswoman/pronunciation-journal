export type ThemeMode = "light" | "dark";

/** Resolve persisted/system theme without touching the DOM. */
export function resolveThemeMode(
  savedMode: string | null,
  prefersDark: boolean,
): ThemeMode {
  if (savedMode === "light" || savedMode === "dark") return savedMode;
  return prefersDark ? "dark" : "light";
}

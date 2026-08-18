export type AuthPanelMode = "login" | "register" | "reset" | "recovery";
export type AuthPanelIntent = "explore" | "save";

export function resolveInitialMode(searchParams: URLSearchParams): AuthPanelMode {
  const mode = searchParams.get("mode");
  if (mode === "reset") return "reset";
  if (mode === "recovery") return "recovery";
  if (mode === "register") return "register";
  if (searchParams.get("intent") === "save" && mode !== "login") return "register";
  return "login";
}

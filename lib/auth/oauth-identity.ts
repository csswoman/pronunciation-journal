/** OAuth identity linking helpers for guest → Google upgrade. */

export const GOOGLE_OAUTH_RESUME_PARAM = "oauth_resume";
export const GOOGLE_OAUTH_RESUME_VALUE = "google";

export function isIdentityAlreadyExistsError(input: {
  error?: string | null;
  errorCode?: string | null;
  errorDescription?: string | null;
  message?: string | null;
}): boolean {
  const code = (input.errorCode ?? "").toLowerCase();
  if (code === "identity_already_exists") return true;

  const blob = [
    input.error,
    input.errorDescription,
    input.message,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    blob.includes("identity_already_exists") ||
    blob.includes("already linked to another user")
  );
}

/** Login path that auto-continues with signInWithGoogle for an existing account. */
export function buildGoogleExistingAccountLoginPath(): string {
  return `/login?intent=save&${GOOGLE_OAUTH_RESUME_PARAM}=${GOOGLE_OAUTH_RESUME_VALUE}`;
}

/**
 * Hosted OAuth often lands on the Site URL (`/`) with `code` or error params.
 * Forward those to `/auth/callback` before the authenticated shell swallows them.
 */
export function shouldForwardRootOAuthToCallback(
  searchParams: URLSearchParams,
): boolean {
  if (searchParams.has("code")) return true;
  return isIdentityAlreadyExistsError({
    error: searchParams.get("error"),
    errorCode: searchParams.get("error_code"),
    errorDescription: searchParams.get("error_description"),
  });
}

/** Read identity errors from query string and/or hash fragment. */
export function readOAuthErrorFromLocation(input: {
  search: string;
  hash: string;
}): {
  error: string | null;
  errorCode: string | null;
  errorDescription: string | null;
} {
  const query = new URLSearchParams(
    input.search.startsWith("?") ? input.search.slice(1) : input.search,
  );
  const hashRaw = input.hash.startsWith("#") ? input.hash.slice(1) : input.hash;
  const hash = new URLSearchParams(hashRaw);

  return {
    error: query.get("error") ?? hash.get("error"),
    errorCode: query.get("error_code") ?? hash.get("error_code"),
    errorDescription:
      query.get("error_description") ?? hash.get("error_description"),
  };
}

"use client";

import { useEffect } from "react";
import {
  GOOGLE_OAUTH_RESUME_PARAM,
  GOOGLE_OAUTH_RESUME_VALUE,
  buildGoogleExistingAccountLoginPath,
  isIdentityAlreadyExistsError,
  readOAuthErrorFromLocation,
} from "@/lib/auth/oauth-identity";

/**
 * Hash fragments are invisible to the server proxy. If OAuth lands with
 * identity_already_exists only in the hash (or query), continue as Google sign-in.
 */
export function useOAuthIdentityRecovery() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const oauthError = readOAuthErrorFromLocation({
      search: window.location.search,
      hash: window.location.hash,
    });
    if (!isIdentityAlreadyExistsError(oauthError)) return;

    if (window.location.hash) {
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      );
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get(GOOGLE_OAUTH_RESUME_PARAM) === GOOGLE_OAUTH_RESUME_VALUE) return;

    window.location.replace(buildGoogleExistingAccountLoginPath());
  }, []);
}

import { describe, expect, it } from "vitest";
import {
  GOOGLE_OAUTH_RESUME_PARAM,
  GOOGLE_OAUTH_RESUME_VALUE,
  buildGoogleExistingAccountLoginPath,
  isIdentityAlreadyExistsError,
  readOAuthErrorFromLocation,
  shouldForwardRootOAuthToCallback,
} from "@/lib/auth/oauth-identity";

describe("isIdentityAlreadyExistsError", () => {
  it("detects the Supabase error_code", () => {
    expect(
      isIdentityAlreadyExistsError({
        errorCode: "identity_already_exists",
      }),
    ).toBe(true);
  });

  it("detects the description text from OAuth redirects", () => {
    expect(
      isIdentityAlreadyExistsError({
        error: "server_error",
        errorDescription: "Identity is already linked to another user",
      }),
    ).toBe(true);
  });

  it("detects AuthApiError messages from linkIdentity", () => {
    expect(
      isIdentityAlreadyExistsError({
        message: "Identity is already linked to another user",
      }),
    ).toBe(true);
  });

  it("ignores unrelated OAuth failures", () => {
    expect(
      isIdentityAlreadyExistsError({
        error: "access_denied",
        errorCode: "access_denied",
        errorDescription: "User cancelled",
      }),
    ).toBe(false);
  });
});

describe("buildGoogleExistingAccountLoginPath", () => {
  it("sends guests to login with a Google sign-in resume flag", () => {
    expect(buildGoogleExistingAccountLoginPath()).toBe(
      `/login?intent=save&${GOOGLE_OAUTH_RESUME_PARAM}=${GOOGLE_OAUTH_RESUME_VALUE}`,
    );
  });
});

describe("shouldForwardRootOAuthToCallback", () => {
  it("forwards authorization codes", () => {
    const params = new URLSearchParams("code=abc");
    expect(shouldForwardRootOAuthToCallback(params)).toBe(true);
  });

  it("forwards identity_already_exists errors from the Site URL", () => {
    const params = new URLSearchParams(
      "error=server_error&error_code=identity_already_exists&error_description=Identity+is+already+linked+to+another+user",
    );
    expect(shouldForwardRootOAuthToCallback(params)).toBe(true);
  });

  it("does not forward ordinary home visits", () => {
    expect(shouldForwardRootOAuthToCallback(new URLSearchParams())).toBe(false);
  });
});

describe("readOAuthErrorFromLocation", () => {
  it("reads error params from the query string", () => {
    expect(
      readOAuthErrorFromLocation({
        search:
          "?error=server_error&error_code=identity_already_exists&error_description=Identity+is+already+linked+to+another+user",
        hash: "",
      }),
    ).toEqual({
      error: "server_error",
      errorCode: "identity_already_exists",
      errorDescription: "Identity is already linked to another user",
    });
  });

  it("falls back to hash params when the query is empty", () => {
    expect(
      readOAuthErrorFromLocation({
        search: "",
        hash: "#error=server_error&error_code=identity_already_exists&error_description=Identity+is+already+linked+to+another+user&sb=",
      }),
    ).toMatchObject({
      error: "server_error",
      errorCode: "identity_already_exists",
    });
  });
});

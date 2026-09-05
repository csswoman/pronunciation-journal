import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirectAfterClearingSession } from "@/lib/supabase/redirect-after-sign-out";
import {
  buildGoogleExistingAccountLoginPath,
  isIdentityAlreadyExistsError,
} from "@/lib/auth/oauth-identity";
import { safeNextPath } from "@/lib/auth/safe-next-path";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const destination = safeNextPath(searchParams.get("next"));

  if (
    isIdentityAlreadyExistsError({
      error: searchParams.get("error"),
      errorCode: searchParams.get("error_code"),
      errorDescription: searchParams.get("error_description"),
    })
  ) {
    // Guest tried to link Google, but that identity already belongs to a
    // permanent account. Drop the anonymous session on this redirect so the
    // follow-up signInWithOAuth is not treated as another linkIdentity.
    return redirectAfterClearingSession(
      request,
      `${origin}${buildGoogleExistingAccountLoginPath()}`,
    );
  }

  const providerError = searchParams.get("error");
  if (providerError) {
    console.error("[auth] oauth callback returned an error", {
      error: providerError,
      errorCode: searchParams.get("error_code"),
      errorDescription: searchParams.get("error_description"),
    });
    return NextResponse.redirect(
      `${origin}/login?intent=save&auth_error=oauth`,
    );
  }

  if (!code) {
    // Nothing to exchange: the provider never sent us an authorization code.
    console.error("[auth] oauth callback reached without a code");
    return NextResponse.redirect(`${origin}/login?auth_error=missing_code`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    // Usually a redirect-URL mismatch or an expired/replayed PKCE code.
    // Never fall through to the success path: that silently drops the user
    // on the app with no session and no explanation.
    console.error("[auth] exchangeCodeForSession failed", error);
    return NextResponse.redirect(`${origin}/login?auth_error=exchange`);
  }

  return NextResponse.redirect(`${origin}${destination}`);
}

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  buildGoogleExistingAccountLoginPath,
  isIdentityAlreadyExistsError,
} from "@/lib/auth/oauth-identity";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");
  const destination = next?.startsWith("/") ? next : "/";

  if (
    isIdentityAlreadyExistsError({
      error: searchParams.get("error"),
      errorCode: searchParams.get("error_code"),
      errorDescription: searchParams.get("error_description"),
    })
  ) {
    // Guest tried to link Google, but that identity already belongs to a
    // permanent account — continue as a normal Google sign-in instead.
    return NextResponse.redirect(
      `${origin}${buildGoogleExistingAccountLoginPath()}`,
    );
  }

  if (searchParams.get("error")) {
    return NextResponse.redirect(`${origin}/login?intent=save`);
  }

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  return NextResponse.redirect(`${origin}${destination}`);
}

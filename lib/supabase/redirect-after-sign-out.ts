import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Redirect while clearing the current Auth cookies on the same response.
 *
 * Needed when a guest `linkIdentity` hits identity_already_exists: the
 * anonymous session must not survive onto the follow-up Google sign-in, or
 * GoTrue treats `/authorize` as another link attempt.
 */
export async function redirectAfterClearingSession(
  request: NextRequest,
  location: string,
): Promise<NextResponse> {
  const response = NextResponse.redirect(location);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });
  await supabase.auth.signOut({ scope: "local" });
  return response;
}

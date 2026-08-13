import { createSupabaseServerClient } from "./server";
import { cache } from "react";
import type { User } from "@supabase/supabase-js";

type VerifiedClaims = {
  sub?: string;
  aud?: string | string[];
  email?: string;
  phone?: string;
  role?: string;
  is_anonymous?: boolean;
  app_metadata?: User["app_metadata"];
  user_metadata?: User["user_metadata"];
};

/**
 * Verify the access token once per request (local JWKS when asymmetric keys).
 * Prefer this over getUser() — getUser always hits the Auth API and inflates TTFB.
 * Prefer this over getSession() — session.user is unverified cookie data.
 */
const getVerifiedClaims = cache(async (): Promise<VerifiedClaims | null> => {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getClaims();
    if (error || !data?.claims) return null;
    return data.claims;
  } catch {
    return null;
  }
});

function userFromVerifiedClaims(claims: VerifiedClaims | null): User | null {
  if (!claims?.sub) return null;
  const aud = Array.isArray(claims.aud) ? claims.aud[0] : claims.aud;
  return {
    id: claims.sub,
    aud: aud ?? "authenticated",
    role: claims.role,
    email: claims.email,
    phone: claims.phone,
    is_anonymous: claims.is_anonymous,
    app_metadata: claims.app_metadata ?? {},
    user_metadata: claims.user_metadata ?? {},
    created_at: "",
  };
}

/**
 * Cookie user for Server Components (after JWT verify).
 * Identity and profile fields come from verified claims, not getSession().
 */
export const getSupabaseServerUser = cache(async (): Promise<User | null> => {
  return userFromVerifiedClaims(await getVerifiedClaims());
});

/** Para usar en Server Components — no depende de window. */
export async function getSupabaseServerUserId(): Promise<string | null> {
  const claims = await getVerifiedClaims();
  return claims?.sub ?? null;
}

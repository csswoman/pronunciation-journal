import { describe, expect, it } from "vitest";
import type { User } from "@supabase/supabase-js";
import { isAnonymousUser, isPermanentUser } from "@/lib/auth/is-anonymous";

function user(partial: Partial<User> & { is_anonymous?: boolean }): User {
  return partial as User;
}

describe("isAnonymousUser", () => {
  it("treats null/undefined as anonymous", () => {
    expect(isAnonymousUser(null)).toBe(true);
    expect(isAnonymousUser(undefined)).toBe(true);
  });

  it("detects Supabase anonymous flag", () => {
    expect(isAnonymousUser(user({ id: "a", is_anonymous: true }))).toBe(true);
    expect(isAnonymousUser(user({ id: "b", is_anonymous: false }))).toBe(false);
  });
});

describe("isPermanentUser", () => {
  it("requires a non-anonymous user", () => {
    expect(isPermanentUser(null)).toBe(false);
    expect(isPermanentUser(user({ id: "a", is_anonymous: true }))).toBe(false);
    expect(isPermanentUser(user({ id: "b", is_anonymous: false }))).toBe(true);
  });
});

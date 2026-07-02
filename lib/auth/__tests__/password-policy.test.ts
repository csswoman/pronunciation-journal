import { describe, expect, it } from "vitest";
import {
  PASSWORD_POLICY_MESSAGE,
  publicAuthErrorMessage,
  validatePasswordPolicy,
} from "@/lib/auth/password-policy";

describe("password policy", () => {
  it("accepts passwords with length, uppercase, lowercase, and number", () => {
    expect(validatePasswordPolicy("StrongPass1")).toBeNull();
  });

  it("rejects weak passwords with the public policy message", () => {
    expect(validatePasswordPolicy("short1A")).toBe(PASSWORD_POLICY_MESSAGE);
    expect(validatePasswordPolicy("lowercaseonly1")).toBe(PASSWORD_POLICY_MESSAGE);
    expect(validatePasswordPolicy("UPPERCASEONLY1")).toBe(PASSWORD_POLICY_MESSAGE);
    expect(validatePasswordPolicy("NoNumberHere")).toBe(PASSWORD_POLICY_MESSAGE);
  });

  it("uses a non-provider-specific public auth error", () => {
    expect(publicAuthErrorMessage()).not.toMatch(/supabase|database|provider|stack/i);
  });
});

import { describe, expect, it } from "vitest";
import {
  MIN_PASSWORD_LENGTH,
  validatePasswordPolicy,
  publicAuthErrorMessage,
} from "../password-policy";

describe("Password Policy Validation", () => {
  it("enforces minimum length of 10 characters", () => {
    expect(MIN_PASSWORD_LENGTH).toBe(10);
    expect(validatePasswordPolicy("Ab1!")).not.toBeNull();
    expect(validatePasswordPolicy("Short1Aa")).not.toBeNull(); // 8 chars -> reject
    expect(validatePasswordPolicy("Short1Aabb")).toBeNull(); // 10 chars -> valid
  });

  it("requires uppercase letter", () => {
    expect(validatePasswordPolicy("nouppercase123")).not.toBeNull();
    expect(validatePasswordPolicy("ValidUppercase123")).toBeNull();
  });

  it("requires lowercase letter", () => {
    expect(validatePasswordPolicy("NOLOWERCASE123")).not.toBeNull();
    expect(validatePasswordPolicy("Haslowercase123")).toBeNull();
  });

  it("requires a numeric digit", () => {
    expect(validatePasswordPolicy("NoNumbersHereA")).not.toBeNull();
    expect(validatePasswordPolicy("HasNumbers123A")).toBeNull();
  });

  it("returns generic public error message on auth errors", () => {
    expect(publicAuthErrorMessage()).toBe(
      "No pudimos completar la solicitud. Revisa tus datos e inténtalo de nuevo.",
    );
  });
});

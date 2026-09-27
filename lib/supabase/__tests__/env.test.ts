import { afterEach, describe, expect, it } from "vitest";
import { isSupabaseConfigured } from "../env";

const originalEnv = process.env;

afterEach(() => {
  process.env = originalEnv;
});

describe("isSupabaseConfigured", () => {
  it("accepts HTTPS Supabase URLs", () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: "development",
      NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "a".repeat(40),
    };

    expect(isSupabaseConfigured()).toBe(true);
  });

  it("accepts loopback HTTP only in development", () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: "development",
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "a".repeat(40),
    };

    expect(isSupabaseConfigured()).toBe(true);

    process.env = { ...process.env, NODE_ENV: "production" };
    expect(isSupabaseConfigured()).toBe(false);
  });

  it("rejects non-loopback HTTP URLs", () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: "development",
      NEXT_PUBLIC_SUPABASE_URL: "http://supabase.example.test",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "a".repeat(40),
    };

    expect(isSupabaseConfigured()).toBe(false);
  });
});

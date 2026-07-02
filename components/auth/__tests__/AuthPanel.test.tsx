// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AuthPanel from "../AuthPanel";
import { PASSWORD_POLICY_MESSAGE, publicAuthErrorMessage } from "@/lib/auth/password-policy";

const replace = vi.fn();
const refresh = vi.fn();
let searchParams = new URLSearchParams();

const authActions = vi.hoisted(() => ({
  signInWithEmail: vi.fn(),
  signUpWithEmail: vi.fn(),
  signInAsGuest: vi.fn(),
  signInWithGoogle: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  updatePassword: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh }),
  useSearchParams: () => searchParams,
}));

vi.mock("@/lib/supabase/auth-actions", () => authActions);

describe("AuthPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParams = new URLSearchParams();
    const store = new Map<string, string>();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, value),
        removeItem: (key: string) => store.delete(key),
        clear: () => store.clear(),
      },
    });
  });

  it("shows a public message instead of provider login details", async () => {
    authActions.signInWithEmail.mockResolvedValue({
      data: { session: null },
      error: { message: "Supabase AuthApiError: invalid login credentials" },
    });

    render(<AuthPanel />);

    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "user@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "wrong-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText(publicAuthErrorMessage())).toBeInTheDocument();
    expect(screen.queryByText(/Supabase AuthApiError/i)).not.toBeInTheDocument();
  });

  it("blocks weak recovery passwords before calling Supabase", async () => {
    searchParams = new URLSearchParams("mode=recovery");

    render(<AuthPanel />);

    fireEvent.change(screen.getByLabelText("New password"), { target: { value: "weak" } });
    fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "weak" } });
    fireEvent.click(screen.getByRole("button", { name: "Update password" }));

    expect(await screen.findAllByText(PASSWORD_POLICY_MESSAGE)).toHaveLength(2);
    expect(screen.getByRole("alert")).toHaveTextContent(PASSWORD_POLICY_MESSAGE);
    await waitFor(() => expect(authActions.updatePassword).not.toHaveBeenCalled());
  });

  it("keeps reset and recovery controls labelled and reachable", () => {
    searchParams = new URLSearchParams("mode=reset");

    render(<AuthPanel />);

    expect(screen.getByRole("heading", { name: "Reset your password" })).toBeInTheDocument();
    expect(screen.getByLabelText("Email address")).toHaveAttribute("autocomplete", "email");
    expect(screen.getByRole("button", { name: "Send reset link" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Back to sign in" })).toBeEnabled();
  });

  it("uses an alert region for recovery validation failures", async () => {
    searchParams = new URLSearchParams("mode=recovery");

    render(<AuthPanel />);

    fireEvent.change(screen.getByLabelText("New password"), { target: { value: "StrongPass1" } });
    fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "StrongPass2" } });
    fireEvent.click(screen.getByRole("button", { name: "Update password" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Passwords do not match.");
    expect(authActions.updatePassword).not.toHaveBeenCalled();
  });
});

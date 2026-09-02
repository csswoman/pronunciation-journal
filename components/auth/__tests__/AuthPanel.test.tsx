// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AuthPanel from "../AuthPanel";
import { PASSWORD_POLICY_MESSAGE } from "@/lib/auth/password-policy";

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
  upgradeGuestWithEmail: vi.fn(),
  linkGoogleIdentity: vi.fn(),
  getBrowserSession: vi.fn().mockResolvedValue({ data: { session: null } }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh }),
  useSearchParams: () => searchParams,
}));

vi.mock("@/lib/supabase/auth-actions", () => authActions);

describe("AuthPanel", { timeout: 15_000 }, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParams = new URLSearchParams();
    authActions.getBrowserSession.mockResolvedValue({ data: { session: null } });
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

  // First-time visitors see the guest CTA; the account form is folded behind
  // "¿Ya tienes cuenta? Iniciar sesión". These tests exercise the login form,
  // so they open it first.
  const revealAccountForm = () => {
    const link = screen.queryByRole("button", { name: "Entrar con mi cuenta" });
    if (link) fireEvent.click(link);
  };

  it("surfaces explore-first guest CTA on the default login view", () => {
    render(<AuthPanel />);
    expect(
      screen.getByRole("button", { name: "Probar una sesión" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Empieza a practicar ahora/i }),
    ).toBeInTheDocument();
  });

  it("folds the account form behind a returning-user link for new visitors", () => {
    render(<AuthPanel />);
    expect(screen.queryByLabelText("Correo electrónico")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Entrar con mi cuenta" }));
    expect(screen.getByLabelText("Correo electrónico")).toBeInTheDocument();
  });

  it("shows a friendly message instead of provider login details", async () => {
    authActions.signInWithEmail.mockResolvedValue({
      data: { session: null },
      error: { message: "Supabase AuthApiError: invalid login credentials" },
    });

    render(<AuthPanel />);
    revealAccountForm();

    fireEvent.change(screen.getByLabelText("Correo electrónico"), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "wrong-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    expect(await screen.findByText(/Correo o contraseña incorrectos/i)).toBeInTheDocument();
    expect(screen.queryByText(/Supabase AuthApiError/i)).not.toBeInTheDocument();
  });

  it("shows message and does not navigate when login succeeds but returns no session", async () => {
    authActions.signInWithEmail.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    render(<AuthPanel />);
    revealAccountForm();

    fireEvent.change(screen.getByLabelText("Correo electrónico"), {
      target: { value: "unconfirmed@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "SomePass1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    expect(
      await screen.findByText("Confirma tu correo antes de iniciar sesión."),
    ).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("shows error and create account CTA when login credentials are invalid", async () => {
    authActions.signInWithEmail.mockResolvedValue({
      data: { session: null },
      error: { message: "Invalid login credentials" },
    });

    render(<AuthPanel />);
    revealAccountForm();

    fireEvent.change(screen.getByLabelText("Correo electrónico"), {
      target: { value: "new@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "new-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    expect(await screen.findByText(/Correo o contraseña incorrectos/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Crear una" })).toBeInTheDocument();
    expect(authActions.signUpWithEmail).not.toHaveBeenCalled();
  });

  it("switches to register tab when clicking create account CTA after failed login", async () => {
    authActions.signInWithEmail.mockResolvedValue({
      data: { session: null },
      error: { message: "Invalid login credentials" },
    });

    render(<AuthPanel />);
    revealAccountForm();

    fireEvent.change(screen.getByLabelText("Correo electrónico"), {
      target: { value: "new@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "new-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    await screen.findByText(/Correo o contraseña incorrectos/i);
    fireEvent.click(screen.getByRole("button", { name: "Crear una" }));

    expect(screen.getByRole("tab", { name: "Crear cuenta", selected: true })).toBeInTheDocument();
    expect(screen.queryByText(/Correo o contraseña incorrectos/i)).not.toBeInTheDocument();
  });

  it("upgrades an anonymous guest instead of signing up a new user", async () => {
    searchParams = new URLSearchParams("intent=save&mode=register");
    authActions.getBrowserSession.mockResolvedValue({
      data: {
        session: {
          user: { id: "anon-1", is_anonymous: true },
        },
      },
    });
    authActions.upgradeGuestWithEmail.mockResolvedValue({
      data: { user: { id: "anon-1", is_anonymous: false } },
      error: null,
    });

    render(<AuthPanel />);

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Guardar con esta cuenta" }),
      ).toBeInTheDocument(),
    );

    fireEvent.change(screen.getByLabelText("Correo electrónico"), {
      target: { value: "keep@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "StrongPass1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar con esta cuenta" }));

    await waitFor(() => {
      expect(authActions.upgradeGuestWithEmail).toHaveBeenCalledWith(
        "keep@example.com",
        "StrongPass1",
        "",
      );
    });
    expect(authActions.signUpWithEmail).not.toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith("/");
  });

  it("falls back to Google sign-in when guest linking hits an existing identity", async () => {
    searchParams = new URLSearchParams("intent=save&mode=register");
    authActions.getBrowserSession.mockResolvedValue({
      data: {
        session: {
          user: { id: "anon-1", is_anonymous: true },
        },
      },
    });
    authActions.linkGoogleIdentity.mockResolvedValue({
      data: { provider: "google", url: null },
      error: {
        message: "Identity is already linked to another user",
        code: "identity_already_exists",
      },
    });
    authActions.signInWithGoogle.mockResolvedValue({
      data: { provider: "google", url: "https://accounts.google.com" },
      error: null,
    });

    render(<AuthPanel />);

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Guardar mi progreso con Google" }),
      ).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole("button", { name: "Guardar mi progreso con Google" }));

    await waitFor(() => {
      expect(authActions.linkGoogleIdentity).toHaveBeenCalled();
      expect(authActions.signInWithGoogle).toHaveBeenCalled();
    });
    expect(screen.queryByText(/No pudimos/i)).not.toBeInTheDocument();
  });

  it("auto-resumes Google sign-in when oauth_resume=google is present", async () => {
    searchParams = new URLSearchParams("intent=save&oauth_resume=google");
    authActions.signInWithGoogle.mockResolvedValue({
      data: { provider: "google", url: "https://accounts.google.com" },
      error: null,
    });

    render(<AuthPanel />);

    await waitFor(() => {
      expect(authActions.signInWithGoogle).toHaveBeenCalled();
    });
    expect(replace).toHaveBeenCalledWith("/login?intent=save");
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

    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "StrongPass1" },
    });
    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "StrongPass2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Update password" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Las contraseñas no coinciden.");
    expect(authActions.updatePassword).not.toHaveBeenCalled();
  });
});

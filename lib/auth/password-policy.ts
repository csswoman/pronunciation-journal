export const MIN_PASSWORD_LENGTH = 10;

export const PASSWORD_POLICY_MESSAGE =
  "Usa al menos 10 caracteres, con mayúscula, minúscula y un número.";

export function validatePasswordPolicy(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) return PASSWORD_POLICY_MESSAGE;
  if (!/[a-z]/.test(password)) return PASSWORD_POLICY_MESSAGE;
  if (!/[A-Z]/.test(password)) return PASSWORD_POLICY_MESSAGE;
  if (!/[0-9]/.test(password)) return PASSWORD_POLICY_MESSAGE;
  return null;
}

/**
 * Deliberately vague: used where a precise message would reveal whether an
 * account exists (sign-in, sign-up, password reset).
 */
export function publicAuthErrorMessage(): string {
  return "No pudimos completar la solicitud. Revisa tus datos e inténtalo de nuevo.";
}

/**
 * OAuth and network failures leak nothing about account existence, so these
 * say what actually went wrong instead of the vague message above.
 */
export function oauthErrorMessage(): string {
  return "No pudimos conectar con Google. Inténtalo de nuevo en unos segundos.";
}

export function oauthUnavailableMessage(): string {
  return "El inicio con Google no está disponible ahora mismo. Usa tu correo y contraseña, o inténtalo más tarde.";
}

/** Message for an `auth_error` code sent back by /auth/callback. */
export function authCallbackErrorMessage(code: string | null): string | null {
  switch (code) {
    case "oauth":
      return oauthErrorMessage();
    case "exchange":
      return "No pudimos validar tu inicio de sesión con Google. Vuelve a intentarlo.";
    case "missing_code":
      return "El inicio de sesión con Google quedó incompleto. Vuelve a intentarlo.";
    default:
      return null;
  }
}

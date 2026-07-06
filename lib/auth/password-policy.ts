export const MIN_PASSWORD_LENGTH = 10;

export const PASSWORD_POLICY_MESSAGE =
  "Use at least 10 characters, including uppercase, lowercase, and a number.";

export function validatePasswordPolicy(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) return PASSWORD_POLICY_MESSAGE;
  if (!/[a-z]/.test(password)) return PASSWORD_POLICY_MESSAGE;
  if (!/[A-Z]/.test(password)) return PASSWORD_POLICY_MESSAGE;
  if (!/[0-9]/.test(password)) return PASSWORD_POLICY_MESSAGE;
  return null;
}

export function publicAuthErrorMessage(): string {
  return "We could not complete that request. Check your details and try again.";
}

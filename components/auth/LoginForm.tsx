import { AuthInput } from "@/components/auth/AuthInput";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthCheckbox } from "@/components/auth/AuthCheckbox";
import { AuthGoogleButton } from "@/components/auth/AuthGoogleButton";
import { AuthGuestButton } from "@/components/auth/AuthGuestButton";
import { SocialDivider } from "@/components/auth/SocialDivider";

interface LoginFormProps {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  rememberMe: boolean;
  setRememberMe: (v: boolean) => void;
  pending: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onForgot: () => void;
  onGoogle: () => void;
  onGuest: () => void;
  /** When false, guest CTA lives at the panel level (explore-first). */
  showGuest?: boolean;
  submitLabel?: string;
  googleLabel?: string;
}

export function LoginForm({
  email,
  setEmail,
  password,
  setPassword,
  rememberMe,
  setRememberMe,
  pending,
  onSubmit,
  onForgot,
  onGoogle,
  onGuest,
  showGuest = true,
  submitLabel = "Iniciar sesión",
  googleLabel,
}: LoginFormProps) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col">
      <div className="flex flex-col gap-3">
        <AuthInput
          type="email"
          label="Correo electrónico"
          placeholder="tu@email.com"
          value={email}
          onChange={setEmail}
          required
          autoComplete="email"
        />
        <AuthInput
          type="password"
          label="Contraseña"
          placeholder="········"
          value={password}
          onChange={setPassword}
          required
          autoComplete="current-password"
          minLength={6}
        />
        <div className="flex items-center justify-between">
          <AuthCheckbox
            label="Recordarme"
            checked={rememberMe}
            onChange={setRememberMe}
          />
          <AuthButton
            label="¿Olvidaste la contraseña?"
            pending={false}
            type="button"
            variant="secondary"
            onClick={onForgot}
          />
        </div>
      </div>

      <div className="mt-6">
        <AuthButton label={submitLabel} pending={pending} />
      </div>

      <div className="mt-8">
        <SocialDivider />
        <div className="mt-4 flex flex-col gap-2.5">
          <AuthGoogleButton onClick={onGoogle} pending={pending} label={googleLabel} />
          {showGuest ? <AuthGuestButton onClick={onGuest} pending={pending} /> : null}
        </div>
      </div>
    </form>
  );
}

import { AuthInput } from "@/components/auth/AuthInput";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthCheckbox } from "@/components/auth/AuthCheckbox";
import { AuthGoogleButton } from "@/components/auth/AuthGoogleButton";
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
  onGuest?: () => void;
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
  submitLabel = "Iniciar sesión",
  googleLabel,
}: LoginFormProps) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col">
      <AuthGoogleButton onClick={onGoogle} pending={pending} label={googleLabel} />
      <SocialDivider label="o con tu correo" />

      <div className="flex flex-col gap-4">
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
          placeholder="Tu contraseña"
          value={password}
          onChange={setPassword}
          required
          autoComplete="current-password"
          minLength={6}
          rightLabel={
            <AuthButton
              label="¿La olvidaste?"
              pending={false}
              type="button"
              variant="secondary"
              onClick={onForgot}
            />
          }
        />
        <div className="flex items-center pt-0.5">
          <AuthCheckbox
            label="Recordarme en este equipo"
            checked={rememberMe}
            onChange={setRememberMe}
          />
        </div>
      </div>

      <div className="mt-6">
        <AuthButton label={submitLabel} pending={pending} />
      </div>
    </form>
  );
}


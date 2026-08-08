import { AuthInput } from "@/components/auth/AuthInput";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthGoogleButton } from "@/components/auth/AuthGoogleButton";
import { AuthGuestButton } from "@/components/auth/AuthGuestButton";
import { SocialDivider } from "@/components/auth/SocialDivider";

interface RegisterFormProps {
  name: string;
  setName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  pending: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onGoogle: () => void;
  onGuest: () => void;
  showGuest?: boolean;
  submitLabel?: string;
  googleLabel?: string;
}

export function RegisterForm({
  name,
  setName,
  email,
  setEmail,
  password,
  setPassword,
  pending,
  onSubmit,
  onGoogle,
  onGuest,
  showGuest = true,
  submitLabel = "Crear cuenta",
  googleLabel,
}: RegisterFormProps) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col">
      <div className="flex flex-col gap-3">
        <AuthInput
          type="text"
          label="Nombre"
          placeholder="Tu nombre"
          value={name}
          onChange={setName}
          autoComplete="name"
        />
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
          placeholder="Al menos 6 caracteres"
          value={password}
          onChange={setPassword}
          required
          autoComplete="new-password"
          minLength={6}
        />
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

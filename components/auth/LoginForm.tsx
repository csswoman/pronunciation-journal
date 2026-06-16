import { AuthInput } from "@/components/auth/AuthInput";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthCheckbox } from "@/components/auth/AuthCheckbox";
import { AuthGoogleButton } from "@/components/auth/AuthGoogleButton";
import { AuthGuestButton } from "@/components/auth/AuthGuestButton";
import { SocialDivider } from "@/components/auth/SocialDivider";

interface LoginFormProps {
  email: string; setEmail: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  rememberMe: boolean; setRememberMe: (v: boolean) => void;
  pending: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onForgot: () => void;
  onGoogle: () => void;
  onGuest: () => void;
}

export function LoginForm({ email, setEmail, password, setPassword, rememberMe, setRememberMe, pending, onSubmit, onForgot, onGoogle, onGuest }: LoginFormProps) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col">
      {/* Credential group — tight */}
      <div className="flex flex-col gap-3">
        <AuthInput type="email" label="Email address" placeholder="you@example.com" value={email} onChange={setEmail} required autoComplete="email" />
        <AuthInput type="password" label="Password" placeholder="········" value={password} onChange={setPassword} required autoComplete="current-password" minLength={6} />
        <div className="flex items-center justify-between">
          <AuthCheckbox label="Remember me" checked={rememberMe} onChange={setRememberMe} />
          <AuthButton label="Forgot password?" pending={false} type="button" variant="secondary" onClick={onForgot} />
        </div>
      </div>

      {/* Primary CTA — generous separation */}
      <div className="mt-6">
        <AuthButton label="Sign in" pending={pending} />
      </div>

      {/* Social options — distinct section */}
      <div className="mt-8">
        <SocialDivider />
        <div className="mt-4 flex flex-col gap-2.5">
          <AuthGoogleButton onClick={onGoogle} pending={pending} />
          <AuthGuestButton onClick={onGuest} pending={pending} />
        </div>
      </div>
    </form>
  );
}

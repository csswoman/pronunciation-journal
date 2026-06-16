import { AuthInput } from "@/components/auth/AuthInput";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthGoogleButton } from "@/components/auth/AuthGoogleButton";
import { AuthGuestButton } from "@/components/auth/AuthGuestButton";
import { SocialDivider } from "@/components/auth/SocialDivider";

interface RegisterFormProps {
  name: string; setName: (v: string) => void;
  email: string; setEmail: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  pending: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onGoogle: () => void;
  onGuest: () => void;
}

export function RegisterForm({ name, setName, email, setEmail, password, setPassword, pending, onSubmit, onGoogle, onGuest }: RegisterFormProps) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col">
      {/* Credential group — tight */}
      <div className="flex flex-col gap-3">
        <AuthInput type="text" label="Full name" placeholder="Your name" value={name} onChange={setName} autoComplete="name" />
        <AuthInput type="email" label="Email address" placeholder="you@example.com" value={email} onChange={setEmail} required autoComplete="email" />
        <AuthInput type="password" label="Password" placeholder="At least 6 characters" value={password} onChange={setPassword} required autoComplete="new-password" minLength={6} />
      </div>

      {/* Primary CTA */}
      <div className="mt-6">
        <AuthButton label="Create account" pending={pending} />
      </div>

      {/* Social options */}
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

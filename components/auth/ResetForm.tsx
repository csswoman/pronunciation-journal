import { AuthInput } from "@/components/auth/AuthInput";
import { AuthButton } from "@/components/auth/AuthButton";

interface ResetFormProps {
  email: string; setEmail: (v: string) => void;
  pending: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}

export function ResetForm({ email, setEmail, pending, onSubmit, onBack }: ResetFormProps) {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-fg font-semibold text-base">Reset your password</h2>
        <p className="text-fg-muted text-sm mt-1">Enter your email and we&apos;ll send you a link.</p>
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-space-4">
        <AuthInput type="email" label="Email address" placeholder="you@example.com" value={email} onChange={setEmail} required autoComplete="email" />
        <AuthButton label="Send reset link" pending={pending} />
        <AuthButton label="Back to sign in" pending={pending} type="button" variant="secondary" onClick={onBack} />
      </form>
    </>
  );
}

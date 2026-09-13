// Planned structure:
// <LandingClose>
//   final CTA band
//   <LandingFooter />  — legal + repo links
import Link from "next/link";
import { LandingSection } from "@/components/landing/LandingSection";

export function LandingClose() {
  return (
    <>
      <LandingSection tone="sunken">
        <div className="flex flex-col items-center gap-[var(--space-5)] text-center">
          <h2 className="text-[length:clamp(1.75rem,1.2rem+2.2vw,2.75rem)] font-[var(--text-weight-h1)] leading-[var(--text-leading-h1)] tracking-[var(--text-tracking-h1)] text-[var(--text-primary)] text-balance">
            Tu voz. Tu nivel. Tu diario.
          </h2>
          <p className="max-w-xl font-[var(--font-body)] text-[var(--text-secondary)] text-pretty">
            Empieza con una sesión de cinco minutos. No necesitas saber IPA, ni
            qué es un par mínimo, ni crear una cuenta.
          </p>
          <Link
            href="/login"
            className="rounded-[var(--radius-full)] bg-[var(--cta-bg)] px-[var(--space-8)] py-[var(--space-4)] font-[var(--font-label)] text-[var(--cta-fg)] transition-transform hover:-translate-y-[1px]"
          >
            Probar sin cuenta
          </Link>
        </div>
      </LandingSection>

      <LandingFooter />
    </>
  );
}

function LandingFooter() {
  return (
    <footer className="border-t border-[var(--border)] px-[var(--space-5)] py-[var(--space-8)]">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-[var(--space-4)] sm:flex-row sm:items-center sm:justify-between">
        <p className="font-[var(--font-caption)] text-[var(--text-tertiary)]">
          English Journal — proyecto personal de aprendizaje de inglés
        </p>
        <nav className="flex flex-wrap gap-[var(--space-5)]">
          <FooterLink href="/login">Entrar</FooterLink>
          <FooterLink href="/privacy">Privacidad</FooterLink>
          <FooterLink href="/terms">Términos</FooterLink>
        </nav>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="font-[var(--font-caption)] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
    >
      {children}
    </Link>
  );
}

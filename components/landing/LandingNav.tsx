// Planned structure:
// <LandingNav>
//   brand mark (Logo mark + "English Journal" title)
//   nav links ("Cómo funciona", "Qué incluye", "Entrar")
//   Theme toggle & CTA button ("Probar sin cuenta" in pill)
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/illustrations/Logo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function LandingNav() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    id: string
  ) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.pushState(null, "", `#${id}`);
    } else {
      window.location.href = `/landing#${id}`;
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? "border-b border-[var(--border-subtle)] bg-[var(--bg)]/85 shadow-xs backdrop-blur-md py-3.5"
          : "bg-transparent py-6 sm:py-8"
      }`}
    >
      <nav
        aria-label="Principal"
        className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8"
      >
        <Link
          href="/landing"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
        >
          <Logo className="size-6 text-[var(--text-strong)]" />
          <span className="font-display text-base font-extrabold tracking-tight text-[var(--text-strong)]">
            English Journal
          </span>
        </Link>

        <div className="flex items-center gap-4 sm:gap-6">
          <a
            href="#como-funciona"
            onClick={(e) => handleNavClick(e, "como-funciona")}
            className="hidden text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-strong)] sm:inline-block cursor-pointer"
          >
            Cómo funciona
          </a>
          <a
            href="#que-incluye"
            onClick={(e) => handleNavClick(e, "que-incluye")}
            className="hidden text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-strong)] sm:inline-block cursor-pointer"
          >
            Qué incluye
          </a>
          <Link
            href="/login"
            className="text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-strong)]"
          >
            Entrar
          </Link>
          <ThemeToggle />
          <Link
            href="/login"
            className="rounded-full bg-[var(--cta-bg)] px-4 py-2 text-xs font-semibold text-[var(--cta-fg)] transition-all hover:opacity-90 active:scale-95 sm:px-5 sm:text-sm font-display focus-ring"
          >
            Probar sin cuenta
          </Link>
        </div>
      </nav>
    </header>
  );
}

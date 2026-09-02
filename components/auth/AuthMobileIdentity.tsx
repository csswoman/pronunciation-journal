// Planned structure:
// <AuthMobileIdentity>
//   <Image fill />         — full-bleed login background
//   <DarkOverlay />
//   <BottomGradient />
//   <Wordmark />
// </AuthMobileIdentity>

import Image from "next/image";

const BACKGROUND_SRC = "/images/background.jpg";

// Mobile-only hero: background image + dark overlay + wordmark
export function AuthMobileIdentity() {
  return (
    <div className="auth-mobile-hero relative lg:hidden overflow-hidden">
      <Image
        src={BACKGROUND_SRC}
        alt=""
        fill
        className="object-cover object-center"
        quality={70}
        priority
        sizes="100vw"
      />

      {/* Dark overlay for legibility */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Bottom-to-top gradient reinforces text contrast */}
      <div className="auth-mobile-gradient absolute inset-0 pointer-events-none" />

      {/* Wordmark — not an h1; the form owns the page heading */}
      <div className="absolute inset-x-0 bottom-0 px-[var(--layout-page-inline)] pb-7 z-10">
        <p className="font-bold leading-tight text-white text-h2 tracking-[-0.02em]">
          English Journal
        </p>
        <p className="mt-1 text-white/70 text-body-sm">
          Pronunciación y vocabulario, sesión a sesión.
        </p>
      </div>
    </div>
  );
}

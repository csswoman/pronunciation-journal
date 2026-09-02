// Planned structure:
// <AuthImagePanel>
//   <Image fill />        — full-bleed login background
//   <Logo />             — brand mark, top-left over the photo
//   <BottomGradient />    — dark gradient for form edge legibility
// </AuthImagePanel>

import Image from "next/image";
import { Logo } from "@/components/illustrations/Logo";

const BACKGROUND_SRC = "/images/background.jpg";

export function AuthImagePanel() {
  return (
    <div className="relative hidden lg:block lg:w-[45%] shrink-0 overflow-hidden bg-surface-sunken">
      <Image
        src={BACKGROUND_SRC}
        alt=""
        fill
        className="object-cover object-left"
        quality={80}
        priority
        sizes="45vw"
      />

      {/* Brand mark over the photo */}
      <Logo className="absolute top-6 left-6 size-9 text-white drop-shadow-md" />

      {/* Bottom gradient so image always reads against the form edge */}
      <div className="auth-image-gradient absolute inset-x-0 bottom-0 h-32 pointer-events-none" />
    </div>
  );
}

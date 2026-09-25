// Planned structure:
// <AuthImagePanel>
//   <BrandHeader>
//     <BadgeAa />
//     <BrandName />
//   </BrandHeader>
//   <HeroImage fill />
// </AuthImagePanel>

import Image from "next/image";

const BACKGROUND_SRC = "/images/background.png";

export function AuthImagePanel() {
  return (
    <div className="relative hidden lg:flex lg:w-[48%] xl:w-[45%] shrink-0 flex-col justify-between rounded-[32px] bg-[var(--bg)] p-8 overflow-hidden select-none border border-white/5">
      {/* Top-left brand mark */}
      <div className="flex items-center gap-3 relative z-10">
        <div className="flex size-9 items-center justify-center rounded-xl bg-[var(--butter)] text-black font-bold text-sm shadow-xs border border-black/10">
          Aa
        </div>
        <span className="font-bold text-white text-base tracking-tight">
          English Journal
        </span>
      </div>

      {/* Center illustration image */}
      <div className="relative flex-1 flex items-center justify-center my-auto p-4">
        <div className="relative w-full h-full max-w-lg min-h-[380px]">
          <Image
            src={BACKGROUND_SRC}
            alt="English Journal"
            fill
            className="object-contain object-center"
            priority
            sizes="(max-width: 1200px) 45vw, 600px"
          />
        </div>
      </div>
    </div>
  );
}




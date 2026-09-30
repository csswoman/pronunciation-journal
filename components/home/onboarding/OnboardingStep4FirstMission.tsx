"use client";

// Planned structure:
// <OnboardingStep4FirstMission>
//   <LeftInfoColumn: kicker, title, desc, saveProgressFootnote />
//   <RightInteractivePreviewCard: Sound Lab mint card with ship vs sheep audio buttons, tip, mic trigger />
// </OnboardingStep4FirstMission>

import { Mic, Volume2 } from "@/components/icons";
import PastelCard from "@/components/layout/PastelCard";
import { speakText } from "@/lib/speech/synthesis";

export default function OnboardingStep4FirstMission() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
      {/* Columna izquierda: Presentación de la primera misión */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-caption text-fg-subtle tracking-wider uppercase font-semibold">
            Empecemos ya
          </span>
          <h2 className="font-heading text-h2 font-extrabold text-fg tracking-tight leading-tight">
            Ship o sheep. Dilo y compruébalo.
          </h2>
          <p className="text-body-md text-fg-muted">
            El contraste que más confunde a un hispanohablante. Escucha las dos, grábate y mira cuál te sale de verdad.
          </p>
        </div>

        <p className="text-caption text-fg-subtle pt-4 border-t border-border-subtle">
          Esto se guarda en tu dispositivo. Crea una cuenta en Perfil para no perderlo.
        </p>
      </div>

      {/* Columna derecha: Tarjeta interactiva de Sound Lab (Mint) */}
      <div className="lg:col-span-7">
        <PastelCard tone="mint" className="p-5 rounded-3xl flex flex-col gap-4 shadow-md">
          {/* Badge superior */}
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-ink/10 px-3 py-1 font-mono text-[11px] font-bold text-ink uppercase tracking-wider">
              MISIÓN 1 · SOUND LAB
            </span>
            <span className="text-caption font-semibold text-ink-muted">· 1 min</span>
          </div>

          {/* Tarjetas comparativas de palabras ship / sheep */}
          <div className="grid grid-cols-2 gap-3">
            {/* Word 1: ship */}
            <div className="rounded-2xl bg-paper/90 p-3.5 flex flex-col gap-2 border border-ink/5 relative">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-heading text-h2 font-extrabold text-ink leading-tight">ship</h3>
                  <span className="font-ipa text-body-sm font-semibold text-ink-secondary block">/ʃɪp/</span>
                  <span className="text-caption text-ink-muted">barco</span>
                </div>
                <button
                  type="button"
                  onClick={() => speakText("ship")}
                  aria-label="Escuchar ship"
                  className="rounded-full bg-ink p-2 text-paper hover:scale-110 active:scale-95 transition-transform cursor-pointer shadow-xs"
                >
                  <Volume2 size={16} aria-hidden />
                </button>
              </div>
            </div>

            {/* Word 2: sheep (con badge DI ESTA) */}
            <div className="rounded-2xl bg-paper/90 p-3.5 flex flex-col gap-2 border border-ink/5 relative">
              <span className="absolute -top-2.5 left-3 rounded-md bg-ink px-2 py-0.5 font-mono text-[9px] font-bold text-paper uppercase tracking-wider">
                DI ESTA
              </span>
              <div className="flex items-start justify-between mt-1">
                <div>
                  <h3 className="font-heading text-h2 font-extrabold text-ink leading-tight">sheep</h3>
                  <span className="font-ipa text-body-sm font-semibold text-ink-secondary block">/ʃiːp/</span>
                  <span className="text-caption text-ink-muted">oveja</span>
                </div>
                <button
                  type="button"
                  onClick={() => speakText("sheep")}
                  aria-label="Escuchar sheep"
                  className="rounded-full bg-ink p-2 text-paper hover:scale-110 active:scale-95 transition-transform cursor-pointer shadow-xs"
                >
                  <Volume2 size={16} aria-hidden />
                </button>
              </div>
            </div>
          </div>

          {/* Pista fonética (Butter soft banner) */}
          <div className="rounded-xl bg-butter-soft/90 p-3 border border-butter-deep/20 text-body-xs text-ink font-medium">
            <span className="font-bold">Pista:</span> en <strong className="font-bold">sheep</strong> la i es larga y tensa; en <strong className="font-bold">ship</strong>, corta y relajada.
          </div>

          {/* Acción de grabación interactiva */}
          <div className="rounded-2xl bg-paper/70 p-3.5 flex items-center gap-3.5 border border-ink/10">
            <div className="size-11 rounded-full bg-ink flex items-center justify-center text-paper shrink-0 shadow-sm">
              <Mic size={20} aria-hidden />
            </div>
            <div className="flex flex-col gap-0.5">
              <h4 className="text-body-sm font-bold text-ink">Toca y di «sheep»</h4>
              <p className="text-caption text-ink-secondary">Te decimos al instante si sonó /iː/ o /ɪ/.</p>
            </div>
          </div>
        </PastelCard>
      </div>
    </div>
  );
}

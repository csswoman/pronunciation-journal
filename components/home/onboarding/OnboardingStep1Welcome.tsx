"use client";

// Planned structure:
// <OnboardingStep1Welcome>
//   <LeftHeroColumn: kicker, title, description, bulletPillsList />
//   <RightCardsComposition: WordOfDayCard, SoundLabCard, PhraseOfDayCard />
// </OnboardingStep1Welcome>

import { Volume2 } from "@/components/icons";
import PastelCard from "@/components/layout/PastelCard";
import { speakText } from "@/lib/speech/synthesis";
import { STEP_1_BULLETS } from "../welcome-tour-data";

export default function OnboardingStep1Welcome() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
      {/* Columna izquierda: mensaje principal y viñetas */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-caption text-fg-subtle tracking-wider uppercase font-semibold">
            English Journal
          </span>
          <h2 className="font-heading text-h2 font-extrabold text-fg tracking-tight leading-tight">
            Deja de entender el inglés. Empieza a oírlo.
          </h2>
          <p className="text-body-md text-fg-muted">
            Escucha, grábate y compara tu voz con la real. Pocos minutos al día, sin presión.
          </p>
        </div>

        <ul className="flex flex-col gap-2.5 pt-2">
          {STEP_1_BULLETS.map((bullet) => (
            <li key={bullet.text} className="flex items-center gap-3 text-body-sm font-medium text-fg">
              <span
                data-tone={bullet.tone}
                className="pastel-card size-3.5 rounded-full shrink-0 shadow-xs"
                aria-hidden
              />
              <span>{bullet.text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Columna derecha: composición visual de tarjetas de demostración */}
      <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
        {/* Tarjeta 1 (Coral): Palabra del día */}
        <PastelCard tone="coral" className="flex flex-col gap-3.5 p-5 sm:col-span-1 shadow-md">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-ink/10 px-3 py-1 font-mono text-[11px] font-bold text-ink uppercase tracking-wider">
              Palabra del día
            </span>
          </div>

          <div className="flex flex-col gap-0.5">
            <h3 className="font-heading text-h2 font-extrabold text-ink leading-tight">sale</h3>
            <span className="font-ipa text-body-md font-semibold text-ink-secondary">/seɪl/</span>
            <p className="text-body-sm font-medium text-ink-muted">venta · rebaja</p>
          </div>

          <div className="rounded-xl bg-paper/85 p-3 flex flex-col gap-1 border border-ink/5">
            <span className="font-mono text-[10px] font-bold text-ink-muted uppercase">Ejemplo</span>
            <p className="text-body-sm font-bold text-ink leading-snug">These shoes are on sale.</p>
            <p className="text-caption text-ink-secondary">Estos zapatos están en rebaja.</p>
          </div>

          <button
            type="button"
            onClick={() => speakText("sale")}
            className="flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-2 text-paper text-body-sm font-bold hover:scale-[1.02] active:scale-98 transition-transform cursor-pointer shadow-xs"
          >
            <Volume2 size={16} aria-hidden />
            <span>Toca y repite</span>
          </button>
        </PastelCard>

        {/* Columna derecha secundaria: Sound Lab + Frase del día */}
        <div className="flex flex-col gap-4 sm:col-span-1">
          {/* Tarjeta 2 (Sky): Sound Lab */}
          <PastelCard tone="sky" className="flex flex-col gap-3 p-4 shadow-sm">
            <span className="w-fit rounded-full bg-ink/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-ink uppercase tracking-wider">
              Sound Lab
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-paper/90 p-2.5 text-center border border-ink/5">
                <span className="font-heading text-body-md font-bold text-ink block">ship</span>
                <span className="font-ipa text-caption text-ink-secondary">/ʃɪp/</span>
              </div>
              <div className="rounded-lg bg-paper/90 p-2.5 text-center border border-ink/5">
                <span className="font-heading text-body-md font-bold text-ink block">sheep</span>
                <span className="font-ipa text-caption text-ink-secondary">/ʃiːp/</span>
              </div>
            </div>
            <p className="text-caption font-semibold text-ink-secondary text-center">¿Oyes la diferencia?</p>
          </PastelCard>

          {/* Tarjeta 3 (Butter): Frase del día */}
          <PastelCard tone="butter" className="flex flex-col gap-2.5 p-4 shadow-sm">
            <span className="w-fit rounded-full bg-ink/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-ink uppercase tracking-wider">
              Frase del día
            </span>
            <h4 className="font-heading text-body-md font-bold text-ink leading-snug">
              Let's read between the lines.
            </h4>
            <span className="font-ipa text-caption text-ink-secondary">/lɛts riːd bɪ'twiːn ðə laɪnz/</span>
            <p className="text-caption text-ink-muted">Leamos entre líneas.</p>
          </PastelCard>
        </div>
      </div>
    </div>
  );
}

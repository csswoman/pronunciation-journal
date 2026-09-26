"use client";

// Planned structure:
// <ProfileAppearanceCard>
//   <AppearanceHeader />
//   <ModeSegmentedControl />
//   <AccentSwatchesGrid />
//   <SelectedAccentText />
// </ProfileAppearanceCard>

import { useOKLCHTheme } from "@/hooks/useOKLCHTheme";
import { ACCENT_PRESETS, type AccentId } from "@/lib/theme/accent-presets";

export default function ProfileAppearanceCard() {
  const { preference, setPreference, accent, setAccent } = useOKLCHTheme();

  const selectedPreset = ACCENT_PRESETS.find((p) => p.id === accent) || ACCENT_PRESETS[6];

  return (
    <section
      aria-labelledby="profile-appearance-title"
      className="layout-stack rounded-xl border border-border-subtle bg-surface-raised p-6 shadow-xs"
    >
      <div className="layout-stack-tight">
        <h2 id="profile-appearance-title" className="m-0 font-display text-h3 font-bold text-fg">
          Apariencia
        </h2>
        <p className="m-0 font-display text-body-sm text-fg-muted">
          El color de tema tiñe botones y elementos activos. Las tarjetas de color no cambian.
        </p>
      </div>

      <div className="layout-stack gap-5 pt-2">
        {/* Modo row */}
        <div className="layout-stack-tight">
          <span className="font-caption font-medium text-fg-muted">Modo</span>
          <div>
            <div className="inline-flex flex-wrap items-center gap-1 rounded-full border border-border-subtle bg-surface-sunken p-1">
              {(
                [
                  { id: "light", label: "Claro" },
                  { id: "dark", label: "Oscuro" },
                  { id: "system", label: "Según el sistema" },
                ] as const
              ).map((item) => {
                const isActive = preference === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPreference(item.id)}
                    aria-pressed={isActive}
                    className={`rounded-full px-4 py-1.5 font-label text-body-sm font-semibold transition-all whitespace-nowrap ${
                      isActive
                        ? "bg-primary text-on-primary shadow-xs"
                        : "text-fg-muted hover:text-fg"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Color de tema row */}
        <div className="layout-stack-tight">
          <span className="font-caption font-medium text-fg-muted">Color de tema</span>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {ACCENT_PRESETS.map((preset) => {
              const isSelected = accent === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setAccent(preset.id as AccentId)}
                  title={preset.label}
                  aria-label={`Tema ${preset.label}`}
                  style={{ backgroundColor: preset.hex }}
                  className={`flex size-9 items-center justify-center rounded-full text-white transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                    isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-surface-raised" : ""
                  }`}
                >
                  {isSelected && (
                    <svg className="size-4 drop-shadow-xs" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-1.5">
            <span className="font-caption font-medium text-fg-muted">
              Elegido: <strong className="font-semibold text-fg">{selectedPreset.label}</strong>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

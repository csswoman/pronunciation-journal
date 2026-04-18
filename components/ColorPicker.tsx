"use client";
import Button from "@/components/ui/Button";

import { type ThemeName, THEME_NAMES, themes, injectTheme } from "@/lib/themes";

interface ColorPickerProps {
  selectedTheme: ThemeName;
  onThemeChange: (theme: ThemeName) => void;
  isLoading?: boolean;
}

export default function ColorPicker({
  selectedTheme,
  onThemeChange,
  isLoading = false,
}: ColorPickerProps) {
  const handleSelect = (name: ThemeName) => {
    if (isLoading) return;
    injectTheme(name);
    onThemeChange(name);
  };

  return (
    <div className="space-y-5">
      <label className="text-sm font-medium text-gray-900 dark:text-white">
        Tema de la Aplicación
      </label>

      {/* Theme grid — 4 columns × 2 rows */}
      <div className="grid grid-cols-4 gap-2">
        {THEME_NAMES.map((name) => {
          const theme = themes[name];
          const isSelected = name === selectedTheme;

          return (
            <Button
              key={name}
              onClick={() => handleSelect(name)}
              disabled={isLoading}
              title={theme.label}
              className={[
                "group flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all duration-200",
                isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                isSelected
                  ? "border-transparent ring-2 ring-accent shadow-md scale-[1.04]"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500 hover:scale-[1.03]",
              ].join(" ")}
            >
              {/* Accent swatch */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-transform"
                style={{ backgroundColor: theme.light.accent }}
              >
                {isSelected && (
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    style={{ color: theme.light.textOnAccent }}
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>

              {/* Theme name */}
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {theme.label}
              </span>
            </Button>
          );
        })}
      </div>

      {/* Live preview */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-3 transition-colors duration-300">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Vista previa
        </p>

        {/* Card — neutral surface, accent only on interactive elements */}
        <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900 space-y-2.5">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            Pronunciation Journal
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Practica tu pronunciación cada día
          </p>

          <div className="flex items-center gap-2 pt-0.5">
            {/* Accent-soft badge — small highlight only */}
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              style={{
                backgroundColor: "var(--color-accent-soft)",
                color: "var(--color-accent)",
              }}
            >
              {themes[selectedTheme].label}
            </span>
          </div>
        </div>

        {/* Primary button — accent default, accent-hover on hover */}
        <Button
          tabIndex={-1}
          className="w-full py-2 rounded-xl text-sm font-semibold shadow-sm accent-button"
        >
          Guardar cambios
        </Button>
      </div>
    </div>
  );
}


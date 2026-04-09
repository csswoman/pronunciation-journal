"use client";

import React from "react";
import ThemedButton from "./ThemedButton";

export default function ThemePreview({ name }: { name?: string }) {
  return (
    <div className="p-4 rounded-md border" style={{ background: "var(--color-accent-soft)" }}>
      <div className="mb-3">
        <div className="text-[var(--color-text-primary)] font-semibold">Preview</div>
        <div className="text-sm text-[var(--color-text-secondary)]">
          {name ? `${name} theme` : "Primary button uses accent token"}
        </div>
      </div>
      <ThemedButton>Primary</ThemedButton>
    </div>
  );
}

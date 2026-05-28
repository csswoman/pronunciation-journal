"use client";

import Button from "./Button";
import { Play, Plus, Trash2, AlertCircle, Info, Check } from "lucide-react";

/**
 * ButtonShowcase
 * Demostración de todas las variantes y tamaños del Button component.
 * Útil para QA y diseño visual.
 *
 * Usa: <ButtonShowcase />
 */
export default function ButtonShowcase() {
  return (
    <div className="space-y-12 p-8 bg-[var(--surface-base)]">
      {/* PRIMARY VARIANTS */}
      <section>
        <h2 className="text-xl font-bold mb-4 text-[var(--fg-primary)]">Primary (CTA)</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="primary" size="sm">
            Small
          </Button>
          <Button variant="primary" size="md" icon={<Play size={16} />}>
            Medium (default)
          </Button>
          <Button variant="primary" size="lg" icon={<Play size={18} />}>
            Large
          </Button>
          <Button variant="primary" size="md" disabled>
            Disabled
          </Button>
          <Button variant="primary" size="md" isLoading icon={<Play size={16} />}>
            Loading...
          </Button>
          <Button variant="primary" size="md" fullWidth>
            Full width
          </Button>
        </div>
      </section>

      {/* SECONDARY VARIANTS */}
      <section>
        <h2 className="text-xl font-bold mb-4 text-[var(--fg-primary)]">Secondary</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="secondary" size="sm">
            Small
          </Button>
          <Button variant="secondary" size="md">
            Medium (default)
          </Button>
          <Button variant="secondary" size="lg" icon={<Plus size={18} />} iconPosition="right">
            Large with icon right
          </Button>
          <Button variant="secondary" size="md" disabled>
            Disabled
          </Button>
        </div>
      </section>

      {/* SOFT VARIANTS */}
      <section>
        <h2 className="text-xl font-bold mb-4 text-[var(--fg-primary)]">Soft</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="soft" size="sm">
            Small
          </Button>
          <Button variant="soft" size="md" icon={<Check size={16} />}>
            Medium
          </Button>
          <Button variant="soft" size="lg">
            Large
          </Button>
        </div>
      </section>

      {/* GHOST VARIANTS */}
      <section>
        <h2 className="text-xl font-bold mb-4 text-[var(--fg-primary)]">Ghost</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="ghost" size="sm">
            Small
          </Button>
          <Button variant="ghost" size="md" icon={<Info size={16} />}>
            Medium
          </Button>
          <Button variant="ghost" size="lg">
            Large
          </Button>
        </div>
      </section>

      {/* SEMANTIC COLORS */}
      <section>
        <h2 className="text-xl font-bold mb-4 text-[var(--fg-primary)]">Semantic Colors</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="success" size="md" icon={<Check size={16} />}>
            Success / Approve
          </Button>
          <Button variant="warning" size="md" icon={<AlertCircle size={16} />}>
            Warning / Caution
          </Button>
          <Button variant="error" size="md" icon={<Trash2 size={16} />}>
            Error / Delete
          </Button>
          <Button variant="info" size="md" icon={<Info size={16} />}>
            Info / Learn More
          </Button>
        </div>
      </section>

      {/* ICON POSITIONS */}
      <section>
        <h2 className="text-xl font-bold mb-4 text-[var(--fg-primary)]">Icon Positions</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="primary" size="md" icon={<Play size={16} />} iconPosition="left">
            Icon Left (default)
          </Button>
          <Button variant="primary" size="md" icon={<Play size={16} />} iconPosition="right">
            Icon Right
          </Button>
          <Button variant="secondary" size="sm" icon={<Plus size={14} />}>
            Small with icon
          </Button>
        </div>
      </section>

      {/* FULL WIDTH */}
      <section>
        <h2 className="text-xl font-bold mb-4 text-[var(--fg-primary)]">Full Width</h2>
        <div className="space-y-3 max-w-sm">
          <Button variant="primary" size="md" fullWidth>
            Full width primary
          </Button>
          <Button variant="secondary" size="md" fullWidth>
            Full width secondary
          </Button>
          <Button variant="soft" size="md" fullWidth>
            Full width soft
          </Button>
        </div>
      </section>
    </div>
  );
}

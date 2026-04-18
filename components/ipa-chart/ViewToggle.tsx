"use client";

import Button from "@/components/ui/Button";

export default function ViewToggle({
  view,
  onChange,
}: {
  view: "grid" | "list";
  onChange: (view: "grid" | "list") => void;
}) {
  return (
    <div
      className="flex gap-1 rounded-xl p-1 border"
      style={{
        backgroundColor: "var(--card-bg)",
        borderColor: "var(--line-divider)",
      }}
    >
      <Button onClick={() => onChange("grid")} variant="segmented" size="sm" selected={view === "grid"}>
        ⊞
      </Button>
      <Button onClick={() => onChange("list")} variant="segmented" size="sm" selected={view === "list"}>
        ☰
      </Button>
    </div>
  );
}

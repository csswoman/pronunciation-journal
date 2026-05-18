"use client";

import { FileText, CalendarOff } from "lucide-react";
import Card from "@/components/layout/Card";
import CardHeader from "@/components/ui/CardHeader";

export default function HomeTodo() {
  return (
    <Card variant="compact" className="gap-4">
      <CardHeader
        icon={<FileText size={18} className="text-[var(--primary)]" />}
        title="Today's plan"
      />

      <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
        <CalendarOff size={32} className="text-[var(--text-tertiary)]" />
        <p className="text-sm font-medium text-[var(--text-secondary)]">No plan for today yet</p>
        <p className="text-xs text-[var(--text-tertiary)] max-w-48">
          Daily plans aren&apos;t available yet. Check back soon.
        </p>
      </div>
    </Card>
  );
}

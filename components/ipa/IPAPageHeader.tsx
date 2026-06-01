"use client";

import Link from "next/link";
import { Play, Timer } from "lucide-react";

export default function IPAPageHeader({
  onStartPractice,
  onStartDrill,
  drillLoading = false,
}: {
  onStartPractice?: () => void;
  onStartDrill?: () => void;
  drillLoading?: boolean;
}) {
  return (
    <header>
      <span className="ipa-chart__eyebrow">Learning · IPA Chart</span>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <nav aria-label="Breadcrumb" className="sr-only">
            <Link href="/learning">Learning</Link>
            <span> / IPA Chart</span>
          </nav>

          <h1 className="ipa-chart__title">English Sound Chart</h1>
          <p className="ipa-chart__lead">
            Los 44 fonemas del inglés — explora la articulación de cada uno, ejemplos
            y en qué se diferencia del español.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onStartDrill}
            disabled={drillLoading}
            className="ipa-chart__btn ipa-chart__btn--ghost"
          >
            <Timer size={14} aria-hidden />
            Drill 5 min
          </button>

          <button
            type="button"
            onClick={onStartPractice}
            className="ipa-chart__btn ipa-chart__btn--primary"
          >
            <Play size={14} fill="currentColor" aria-hidden />
            Practicar
          </button>
        </div>
      </div>
    </header>
  );
}

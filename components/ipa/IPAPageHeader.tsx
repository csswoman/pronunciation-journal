"use client";

import Link from "next/link";
import { Play, ArrowDown } from "lucide-react";

export default function IPAPageHeader({
  onStartPractice,
}: {
  onStartPractice?: () => void;
}) {
  return (
    <header className="mb-5 sm:mb-6">
      <span className="ipa-chart__eyebrow">Learning · IPA Chart</span>
      <div className="flex flex-col gap-1 lg:flex-row lg:items-end lg:justify-between lg:gap-5">
        <div>
          <nav aria-label="Breadcrumb" className="sr-only">
            <Link href="/learning">Learning</Link>
            <span> / IPA Chart</span>
          </nav>

          <h1 className="ipa-chart__title">IPA Chart</h1>

          <div className="flex items-center gap-2 mt-4 lg:hidden">
            <a href="#minimal-pairs" className="ipa-chart__btn ipa-chart__btn--ghost">
              <ArrowDown size={14} aria-hidden />
              Practicar aquí
            </a>
            <button
              type="button"
              onClick={onStartPractice}
              className="ipa-chart__btn ipa-chart__btn--primary"
            >
              <Play size={14} fill="currentColor" aria-hidden />
              Sound Lab
            </button>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-2 shrink-0">
          <a href="#minimal-pairs" className="ipa-chart__btn ipa-chart__btn--ghost">
            <ArrowDown size={14} aria-hidden />
            Practicar aquí
          </a>
          <button
            type="button"
            onClick={onStartPractice}
            className="ipa-chart__btn ipa-chart__btn--primary"
          >
            <Play size={14} fill="currentColor" aria-hidden />
            Sound Lab
          </button>
        </div>
      </div>
    </header>
  );
}

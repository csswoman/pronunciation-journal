"use client";

import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import type { PhonemeData } from "@/components/ipa/data";

export function SoundPractice({
  phoneme,
  href,
  onPractice,
}: {
  phoneme: PhonemeData;
  href: string;
  onPractice?: () => void;
}) {
  const content = (
    <>
      Practicar {phoneme.symbol}
      <ArrowRight size={14} aria-hidden />
    </>
  );

  if (onPractice) {
    return (
      <button
        type="button"
        onClick={onPractice}
        className="ipa-chart__btn ipa-chart__btn--primary ipa-chart__panel-practice sound-detail__practice"
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      href={href}
      className="ipa-chart__btn ipa-chart__btn--primary ipa-chart__panel-practice sound-detail__practice"
    >
      {content}
    </Link>
  );
}

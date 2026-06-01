"use client";

import Link from "next/link";
import { Headphones, ArrowUpRight } from "lucide-react";
import type { GrammarPronExample } from "@/lib/courses/grammar-deck/types";
import SpeakButton from "../SpeakButton";

interface Props {
  sound: string;
  focus?: string[];
  examples: GrammarPronExample[];
  note?: string;
}

/** Builds the Sound Lab deep link for the given focus sounds. */
function drillHref(focus: string[] | undefined): string {
  if (!focus || focus.length === 0) return "/practice/sounds";
  return `/practice/sounds?focus=${encodeURIComponent(focus.join(","))}`;
}

export default function GrammarPronunciationBlock({ sound, focus, examples, note }: Props) {
  return (
    <div className="grammar-pron">
      <div className="grammar-pron__head">
        <span className="grammar-pron__badge">
          <Headphones size={13} strokeWidth={2.25} aria-hidden />
          {sound}
        </span>
        <Link href={drillHref(focus)} className="grammar-pron__drill">
          Practicar en Sound Lab
          <ArrowUpRight size={13} aria-hidden />
        </Link>
      </div>

      <ul className="grammar-pron__list">
        {examples.map((ex, i) => (
          <li key={i} className="grammar-pron__item">
            <SpeakButton text={ex.text} size="md" />
            <span className="grammar-pron__text">
              <span className="grammar-pron__phrase">{ex.text}</span>
              {ex.ipa && <span className="grammar-pron__ipa">{ex.ipa}</span>}
              {ex.es && <span className="grammar-pron__es">{ex.es}</span>}
            </span>
          </li>
        ))}
      </ul>

      {note && <p className="grammar-pron__note">{note}</p>}
    </div>
  );
}

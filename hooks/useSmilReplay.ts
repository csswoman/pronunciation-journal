"use client";

import { useEffect, type DependencyList, type RefObject } from "react";

/**
 * (Re)starts every `begin="indefinite"` SMIL animation inside `ref` whenever
 * `deps` change, so a cycle can be synced to an event such as playing audio.
 */
export function useSmilReplay(ref: RefObject<SVGElement | null>, deps: DependencyList): void {
  useEffect(() => {
    const animations = ref.current?.querySelectorAll<SVGAnimationElement>(
      "animate, animateTransform",
    );
    animations?.forEach((animation) => {
      // jsdom and very old engines do not implement SMIL.
      if (typeof animation.beginElement === "function") animation.beginElement();
    });
  }, deps);
}

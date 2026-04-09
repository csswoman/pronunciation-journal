import { useEffect, useState } from "react";

export function useScrollProgress(scrollContainerSelector?: string): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;

    const getScrollContainer = () => {
      if (!scrollContainerSelector) return null;
      return document.querySelector(scrollContainerSelector);
    };

    const updateProgress = () => {
      const container = getScrollContainer();
      const isElement = container instanceof HTMLElement;

      const scrollTop = isElement ? container.scrollTop : window.scrollY;
      const scrollableHeight = isElement
        ? container.scrollHeight - container.clientHeight
        : document.documentElement.scrollHeight - window.innerHeight;

      if (scrollableHeight <= 0) {
        setProgress(100);
        return;
      }

      const nextProgress = Math.min(100, Math.max(0, (scrollTop / scrollableHeight) * 100));
      setProgress(nextProgress);
    };

    const onScroll = () => {
      if (frame !== 0) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        updateProgress();
      });
    };

    updateProgress();
    const container = getScrollContainer();
    if (container instanceof HTMLElement) {
      container.addEventListener("scroll", onScroll, { passive: true });
    } else {
      window.addEventListener("scroll", onScroll, { passive: true });
    }
    window.addEventListener("resize", onScroll);

    return () => {
      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
      }
      if (container instanceof HTMLElement) {
        container.removeEventListener("scroll", onScroll);
      } else {
        window.removeEventListener("scroll", onScroll);
      }
      window.removeEventListener("resize", onScroll);
    };
  }, [scrollContainerSelector]);

  return progress;
}

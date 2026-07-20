import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// RTL cleanup only applies in jsdom; skip in node-environment suites.
if (typeof window !== 'undefined') {
  // Node 22+ may expose an undefined localStorage unless --localstorage-file is set.
  // Zustand persist and other client stores need a working Storage API in jsdom.
  if (typeof window.localStorage?.setItem !== 'function') {
    const memory = new Map<string, string>();
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => memory.get(key) ?? null,
        setItem: (key: string, value: string) => {
          memory.set(key, String(value));
        },
        removeItem: (key: string) => {
          memory.delete(key);
        },
        clear: () => {
          memory.clear();
        },
        key: (index: number) => [...memory.keys()][index] ?? null,
        get length() {
          return memory.size;
        },
      },
    });
  }

  // matchMedia is not implemented in jsdom
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });

  afterEach(() => {
    cleanup();
  });
}

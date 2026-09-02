import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Vitest 4 requires hooks to be registered at the top level of the setup
// module (not inside a runtime conditional), or suite collection fails with
// "Vitest failed to find the current suite" and no tests run. cleanup() is a
// harmless no-op in node suites where nothing was rendered.
afterEach(() => {
  cleanup();
});

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

  // speechSynthesis is not implemented in jsdom; stub it so modules that
  // feature-detect it at import time (e.g. ListenButton's ttsAvailable)
  // see it as available before any test file's imports run.
  if (typeof window.speechSynthesis === 'undefined') {
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      writable: true,
      value: { speak: () => {}, cancel: () => {} },
    })
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
}

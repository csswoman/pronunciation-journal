"use client";

import { useEffect } from "react";

// Planned structure:
// <ServiceWorkerRegistration />
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) {
      return;
    }

    void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((error: unknown) => {
      console.error("No se pudo registrar el Service Worker.", error);
    });
  }, []);

  return null;
}

"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let refreshing = false;

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        // Buscar actualizaciones del SW al cargar.
        reg.update().catch(() => {});

        // Si hay un SW esperando (nueva versión), activarlo de inmediato.
        if (reg.waiting) {
          reg.waiting.postMessage({ type: "SKIP_WAITING" });
        }

        reg.addEventListener("updatefound", () => {
          const nw = reg.installing;
          if (!nw) return;
          nw.addEventListener("statechange", () => {
            if (nw.state === "installed" && navigator.serviceWorker.controller) {
              // Hay una versión nueva lista; tomar control.
              nw.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });
      })
      .catch(() => {});

    // Cuando el SW nuevo toma control, recargar una sola vez para usar el código fresco.
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  }, []);

  return null;
}

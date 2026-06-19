"use client";
import { useEffect, useRef } from "react";

type Punto = {
  id: number; nombre: string; area: string | null;
  direccion: string | null; telefono: string | null;
  lat: number; lng: number;
};

export default function SucursalesMap({ token: _token, puntos }: { token: string; puntos: Punto[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || puntos.length === 0) return;
    let cancelled = false;
    let mapInst: { remove: () => void } | null = null;

    (async () => {
      const L = (await import("leaflet")).default;
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }
      if (cancelled || !ref.current) return;

      const avgLat = puntos.reduce((a, p) => a + p.lat, 0) / puntos.length;
      const avgLng = puntos.reduce((a, p) => a + p.lng, 0) / puntos.length;

      const map = L.map(ref.current, { center: [avgLat, avgLng], zoom: 10, zoomControl: true, attributionControl: false });
      mapInst = map as unknown as { remove: () => void };

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);

      const bounds = L.latLngBounds([]);
      for (const p of puntos) {
        const el = document.createElement("div");
        el.style.cssText = "width:18px;height:18px;border-radius:50%;background:#C41E3A;border:3px solid #fff;box-shadow:0 0 0 4px rgba(196,30,58,.25);cursor:pointer";
        const icon = L.divIcon({ html: el, className: "", iconSize: [18, 18], iconAnchor: [9, 9] });
        L.marker([p.lat, p.lng], { icon })
          .bindPopup(`<div style="font-family:system-ui;min-width:160px"><strong>${p.nombre}</strong>${p.direccion ? `<br/><small>${p.direccion}</small>` : ""}${p.telefono ? `<br/><small>📞 ${p.telefono}</small>` : ""}</div>`)
          .addTo(map);
        bounds.extend([p.lat, p.lng]);
      }
      if (puntos.length > 1) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
      setTimeout(() => map.invalidateSize(), 200);
    })();

    return () => { cancelled = true; mapInst?.remove(); };
  }, [puntos]);

  return <div ref={ref} style={{ height: "380px", width: "100%", display: "block", position: "relative", zIndex: 0, borderRadius: "12px", overflow: "hidden" }} />;
}

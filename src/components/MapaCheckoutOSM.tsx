// @ts-nocheck
"use client";
import { useEffect, useRef } from "react";

type Props = { sucLat: number; sucLng: number; userLat: number | null; userLng: number | null; };

export default function MapaCheckoutOSM({ sucLat, sucLng, userLat, userLng }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    let cancelled = false;
    let mapInst: { remove: () => void } | null = null;

    (async () => {
      const L = (await import("leaflet")).default;
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css"; link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }
      if (cancelled || !ref.current) return;

      const hasUser = userLat != null && userLng != null;
      const cLat = hasUser ? (sucLat + userLat!) / 2 : sucLat;
      const cLng = hasUser ? (sucLng + userLng!) / 2 : sucLng;

      const map = L.map(ref.current, { center: [cLat, cLng], zoom: 13, zoomControl: false, attributionControl: false });
      mapInst = map as unknown as { remove: () => void };
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);

      const elS = document.createElement("div");
      elS.style.cssText = "width:16px;height:16px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 0 0 5px rgba(37,99,235,.3)";
      L.marker([sucLat, sucLng], { icon: L.divIcon({ html: elS, className:"", iconSize:[16,16], iconAnchor:[8,8] }) }).bindTooltip("Sucursal", { permanent: false }).addTo(map);

      if (hasUser) {
        const elU = document.createElement("div");
        elU.style.cssText = "width:16px;height:16px;border-radius:50%;background:#ef4444;border:3px solid #fff;box-shadow:0 0 0 5px rgba(239,68,68,.3)";
        L.marker([userLat!, userLng!], { icon: L.divIcon({ html: elU, className:"", iconSize:[16,16], iconAnchor:[8,8] }) }).bindTooltip("Tu ubicación", { permanent: false }).addTo(map);
        const bounds = L.latLngBounds([[sucLat, sucLng],[userLat!, userLng!]]);
        map.fitBounds(bounds, { padding: [40,40], maxZoom: 14 });
      }
      setTimeout(() => map.invalidateSize(), 200);
    })();
    return () => { cancelled = true; mapInst?.remove(); };
  }, [sucLat, sucLng, userLat, userLng]);

  return <div ref={ref} style={{ height: "200px", width: "100%", display: "block", position: "relative", zIndex: 0 }} />;
}

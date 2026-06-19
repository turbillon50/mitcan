// @ts-nocheck
"use client";

import { useEffect, useRef } from "react";

type Marker = {
  lat: number;
  lng: number;
  color: string; // hex
  pulso?: boolean;
  label?: string;
};

type Props = {
  center: [number, number];
  zoom?: number;
  markers?: Marker[];
  height?: number;
  className?: string;
  onReady?: (map: unknown) => void;
};

export default function MapaOSM({
  center, zoom = 13, markers = [], height = 220, className = "", onReady,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      // CSS de leaflet
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }
      if (cancelled || !ref.current) return;

      const map = L.map(ref.current, {
        center,
        zoom,
        zoomControl: true,
        attributionControl: false,
      });

      // Tiles OpenStreetMap — gratuito, sin token
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      // Marcadores
      for (const m of markers) {
        const el = document.createElement("div");
        el.style.cssText = `
          width: 16px; height: 16px; border-radius: 50%;
          background: ${m.color}; border: 3px solid #fff;
          box-shadow: 0 0 0 4px ${m.color}44;
          ${m.pulso ? `animation: mapa-pulso 1.4s ease infinite;` : ""}
        `;
        const icon = L.divIcon({ html: el, className: "", iconSize: [16, 16], iconAnchor: [8, 8] });
        const marker = L.marker([m.lat, m.lng], { icon });
        if (m.label) marker.bindTooltip(m.label, { permanent: false, direction: "top" });
        marker.addTo(map);
      }

      // Ajustar bounds si hay múltiples marcadores
      if (markers.length > 1) {
        const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }

      mapRef.current = map;
      onReady?.(map);

      // Invalidar tamaño después del mount
      setTimeout(() => map.invalidateSize(), 100);
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        (mapRef.current as { remove: () => void }).remove();
        mapRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <style>{`
        @keyframes mapa-pulso {
          0%, 100% { box-shadow: 0 0 0 4px #f9731644; }
          50% { box-shadow: 0 0 0 10px #f9731600; }
        }
      `}</style>
      <div
        ref={ref}
        className={className}
        style={{ height: `${height}px`, width: "100%", display: "block", position: "relative", zIndex: 0 }}
      />
    </>
  );
}

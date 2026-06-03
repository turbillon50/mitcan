"use client";

import { useEffect, useRef } from "react";
import "mapbox-gl/dist/mapbox-gl.css";

type Punto = {
  id: number;
  nombre: string;
  area: string | null;
  direccion: string | null;
  telefono: string | null;
  lat: number;
  lng: number;
};

export default function SucursalesMap({
  token,
  puntos,
}: {
  token: string;
  puntos: Punto[];
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !token || puntos.length === 0) return;
    let map: import("mapbox-gl").Map | null = null;
    let cancelled = false;

    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      if (cancelled || !ref.current) return;
      mapboxgl.accessToken = token;

      const avgLng = puntos.reduce((a, p) => a + p.lng, 0) / puntos.length;
      const avgLat = puntos.reduce((a, p) => a + p.lat, 0) / puntos.length;

      map = new mapboxgl.Map({
        container: ref.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [avgLng, avgLat],
        zoom: 6,
      });
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

      const bounds = new mapboxgl.LngLatBounds();
      for (const p of puntos) {
        const el = document.createElement("div");
        el.style.cssText =
          "width:18px;height:18px;border-radius:50%;background:#ff8c00;border:2px solid #fff6ee;box-shadow:0 0 0 4px rgba(255,140,0,.25);cursor:pointer";
        const popup = new mapboxgl.Popup({ offset: 16, closeButton: false }).setHTML(
          `<div style="font-family:system-ui;color:#1a0f06">
             <strong>${p.nombre}</strong>
             ${p.direccion ? `<br/><span style="font-size:12px">${p.direccion}</span>` : ""}
             ${p.telefono ? `<br/><span style="font-size:12px">📞 ${p.telefono}</span>` : ""}
           </div>`
        );
        new mapboxgl.Marker(el).setLngLat([p.lng, p.lat]).setPopup(popup).addTo(map);
        bounds.extend([p.lng, p.lat]);
      }
      if (puntos.length > 1) {
        map.fitBounds(bounds, { padding: 60, maxZoom: 12, duration: 0 });
      } else {
        map.setZoom(13);
      }
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [token, puntos]);

  if (!token) {
    return (
      <div className="card flex h-64 items-center justify-center p-6 text-center text-sm text-on-bg-muted">
        Configura el token de Mapbox (NEXT_PUBLIC_MAPBOX_TOKEN) para ver el mapa.
      </div>
    );
  }
  if (puntos.length === 0) {
    return (
      <div className="card flex h-64 items-center justify-center p-6 text-center text-sm text-on-bg-muted">
        Aún no hay sucursales ubicadas en el mapa.
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="h-[420px] w-full overflow-hidden rounded-2xl border border-hairline"
    />
  );
}

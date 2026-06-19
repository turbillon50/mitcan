"use client";
import { useEffect, useRef } from "react";

const SUC_LAT = 21.475156;
const SUC_LNG = -104.857818;
const SUC_NOMBRE = "Nayarabastos";

type Props = { estado: string; direccionEntrega: string | null; destLat: number | null; destLng: number | null };

export default function MapaSeguimientoOSM({ estado, direccionEntrega, destLat, destLng }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    let cancelled = false;
    let mapInst: { remove: () => void } | null = null;
    const enRuta = ["entregado_repartidor","en_camino","ha_llegado"].includes(estado);
    const entregado = estado === "ha_llegado";
    const enCamino = estado === "en_camino";

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

      const hasDestino = destLat != null && destLng != null;
      const cLat = hasDestino ? (SUC_LAT + destLat!) / 2 : SUC_LAT;
      const cLng = hasDestino ? (SUC_LNG + destLng!) / 2 : SUC_LNG;

      const map = L.map(ref.current, { center: [cLat, cLng], zoom: hasDestino ? 13 : 14, zoomControl: false, attributionControl: false });
      mapInst = map as unknown as { remove: () => void };
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);

      // Sucursal — azul
      const elS = document.createElement("div");
      elS.style.cssText = "width:16px;height:16px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 0 0 5px rgba(37,99,235,.3)";
      L.marker([SUC_LAT, SUC_LNG], { icon: L.divIcon({ html: elS, className:"", iconSize:[16,16], iconAnchor:[8,8] }) }).bindTooltip(SUC_NOMBRE, { permanent: false }).addTo(map);

      // Destino — rojo
      if (hasDestino) {
        const elD = document.createElement("div");
        elD.style.cssText = "width:16px;height:16px;border-radius:50%;background:#ef4444;border:3px solid #fff;box-shadow:0 0 0 5px rgba(239,68,68,.3)";
        L.marker([destLat!, destLng!], { icon: L.divIcon({ html: elD, className:"", iconSize:[16,16], iconAnchor:[8,8] }) }).bindTooltip("Tu dirección", { permanent: false }).addTo(map);
      }

      // Repartidor animado — naranja (si en ruta)
      if (enRuta && !entregado) {
        const rLat = hasDestino ? SUC_LAT + (destLat! - SUC_LAT) * 0.4 : SUC_LAT + 0.004;
        const rLng = hasDestino ? SUC_LNG + (destLng! - SUC_LNG) * 0.4 : SUC_LNG + 0.004;
        const color = enCamino ? "#f97316" : "#f59e0b";
        const elR = document.createElement("div");
        elR.style.cssText = `width:20px;height:20px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 0 0 6px ${color}44`;
        if (enCamino) {
          elR.animate([{ boxShadow: `0 0 0 4px ${color}55` }, { boxShadow: `0 0 0 12px ${color}00` }], { duration: 1200, iterations: Infinity });
        }
        L.marker([rLat, rLng], { icon: L.divIcon({ html: elR, className:"", iconSize:[20,20], iconAnchor:[10,10] }) }).bindTooltip("🛵 Repartidor", { permanent: enCamino, direction:"top" }).addTo(map);
      }

      // Línea ruta
      if (hasDestino) {
        const coords: [number,number][] = [[SUC_LAT, SUC_LNG]];
        if (enRuta && !entregado) {
          const rLat = SUC_LAT + (destLat! - SUC_LAT) * 0.4;
          const rLng = SUC_LNG + (destLng! - SUC_LNG) * 0.4;
          coords.push([rLat, rLng]);
        }
        coords.push([destLat!, destLng!]);
        const color = entregado ? "#10b981" : enCamino ? "#f97316" : "#6366f1";
        L.polyline(coords, { color, weight: 3, dashArray: "6 4", opacity: 0.8 }).addTo(map);
        const bounds = L.latLngBounds([[SUC_LAT, SUC_LNG], [destLat!, destLng!]]);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }

      setTimeout(() => map.invalidateSize(), 200);
    })();
    return () => { cancelled = true; mapInst?.remove(); };
  }, [estado, destLat, destLng]);

  return <div ref={ref} style={{ height: "220px", width: "100%", display: "block", position: "relative", zIndex: 0 }} />;
}

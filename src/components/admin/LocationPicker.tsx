// @ts-nocheck
"use client";

import { useEffect, useRef, useState } from "react";
import { LocateFixed } from "lucide-react";

/** Pick a branch location: draggable map marker (Leaflet/OSM) + "use my location".
 *  Writes hidden inputs `lat` and `lng` for the sucursal form. */
export default function LocationPicker({
  token,
  defaultLat,
  defaultLng,
}: {
  token?: string | null;
  defaultLat?: number | null;
  defaultLng?: number | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const markerRef = useRef<any>(null);
  const mapRef = useRef<any>(null);
  const [lat, setLat] = useState<number | null>(defaultLat ?? null);
  const [lng, setLng] = useState<number | null>(defaultLng ?? null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    let cancelled = false;
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

      const startLng = defaultLng ?? -104.894; // Tepic
      const startLat = defaultLat ?? 21.5039;

      const map = L.map(ref.current, {
        center: [startLat, startLng],
        zoom: defaultLat ? 14 : 11,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      const icon = L.divIcon({
        className: "",
        html: `<div style="width:24px;height:24px;border-radius:50% 50% 50% 0;background:#C41E3A;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.4);transform:rotate(-45deg)"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 24],
      });

      const marker = L.marker([startLat, startLng], { draggable: true, icon }).addTo(map);
      markerRef.current = marker;

      marker.on("dragend", () => {
        const ll = marker.getLatLng();
        setLat(+ll.lat.toFixed(6));
        setLng(+ll.lng.toFixed(6));
      });

      map.on("click", (e: any) => {
        marker.setLatLng(e.latlng);
        setLat(+e.latlng.lat.toFixed(6));
        setLng(+e.latlng.lng.toFixed(6));
      });

      mapRef.current = map;
      setTimeout(() => map.invalidateSize(), 300);
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, []);

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const la = +pos.coords.latitude.toFixed(6);
      const ln = +pos.coords.longitude.toFixed(6);
      setLat(la); setLng(ln);
      if (mapRef.current && markerRef.current) {
        mapRef.current.setView([la, ln], 15);
        markerRef.current.setLatLng([la, ln]);
      }
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <div ref={ref} className="h-[220px] w-full overflow-hidden rounded-xl border border-hairline" />
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={useMyLocation} className="btn-ghost py-1.5 text-xs">
          <LocateFixed size={13} /> Usar mi ubicación
        </button>
        <span className="text-[11px] text-on-bg-muted">
          {lat != null && lng != null ? `${lat}, ${lng}` : "Toca o arrastra el pin"}
        </span>
      </div>
      <input type="hidden" name="lat" value={lat ?? ""} />
      <input type="hidden" name="lng" value={lng ?? ""} />
    </div>
  );
}

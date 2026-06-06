"use client";

import { useEffect, useRef, useState } from "react";
import { LocateFixed } from "lucide-react";
import "mapbox-gl/dist/mapbox-gl.css";

/** Pick a branch location: draggable map marker + "use my location".
 *  Writes hidden inputs `lat` and `lng` for the sucursal form. */
export default function LocationPicker({
  token,
  defaultLat,
  defaultLng,
}: {
  token: string | null;
  defaultLat?: number | null;
  defaultLng?: number | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const markerRef = useRef<import("mapbox-gl").Marker | null>(null);
  const mapRef = useRef<import("mapbox-gl").Map | null>(null);
  const [lat, setLat] = useState<number | null>(defaultLat ?? null);
  const [lng, setLng] = useState<number | null>(defaultLng ?? null);

  useEffect(() => {
    if (!token || !ref.current) return;
    let cancelled = false;
    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      if (cancelled || !ref.current) return;
      mapboxgl.accessToken = token;
      const startLng = defaultLng ?? -104.894; // Tepic
      const startLat = defaultLat ?? 21.5039;
      const map = new mapboxgl.Map({
        container: ref.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [startLng, startLat],
        zoom: defaultLat ? 14 : 11,
      });
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
      const marker = new mapboxgl.Marker({ color: "#C41E3A", draggable: true })
        .setLngLat([startLng, startLat])
        .addTo(map);
      marker.on("dragend", () => {
        const ll = marker.getLngLat();
        setLat(+ll.lat.toFixed(6));
        setLng(+ll.lng.toFixed(6));
      });
      map.on("click", (e) => {
        marker.setLngLat(e.lngLat);
        setLat(+e.lngLat.lat.toFixed(6));
        setLng(+e.lngLat.lng.toFixed(6));
      });
      markerRef.current = marker;
      mapRef.current = map;
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
    };
  }, [token, defaultLat, defaultLng]);

  function useMyLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const la = +pos.coords.latitude.toFixed(6);
      const ln = +pos.coords.longitude.toFixed(6);
      setLat(la);
      setLng(ln);
      markerRef.current?.setLngLat([ln, la]);
      mapRef.current?.flyTo({ center: [ln, la], zoom: 15 });
    });
  }

  return (
    <div>
      <label className="label">Ubicación</label>
      <input type="hidden" name="lat" value={lat ?? ""} />
      <input type="hidden" name="lng" value={lng ?? ""} />

      {token ? (
        <>
          <div className="mb-2 flex items-center justify-between gap-2">
            <button type="button" onClick={useMyLocation} className="btn-ghost px-3 py-1.5 text-xs">
              <LocateFixed size={14} /> Usar mi ubicación
            </button>
            <span className="text-xs text-on-bg-muted">
              {lat != null && lng != null ? `${lat}, ${lng}` : "toca el mapa o arrastra el pin"}
            </span>
          </div>
          <div ref={ref} className="h-56 w-full overflow-hidden rounded-xl border border-hairline" />
        </>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <input
            value={lat ?? ""}
            onChange={(e) => setLat(e.target.value ? +e.target.value : null)}
            className="input"
            placeholder="Latitud"
          />
          <input
            value={lng ?? ""}
            onChange={(e) => setLng(e.target.value ? +e.target.value : null)}
            className="input"
            placeholder="Longitud"
          />
        </div>
      )}
      <p className="mt-1 text-xs text-on-bg-muted">
        Si lo dejas vacío, se ubica automáticamente desde la dirección.
      </p>
    </div>
  );
}

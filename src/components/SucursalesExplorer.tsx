"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Phone, Navigation, Clock, MessageCircle, MapPin } from "lucide-react";
import { formatPhone } from "@/lib/format";
import "mapbox-gl/dist/mapbox-gl.css";

type Sucursal = {
  id: number;
  nombre: string;
  area: string | null;
  direccion: string | null;
  telefono: string | null;
  whatsapp: string | null;
  horario: string | null;
  lat: number | null;
  lng: number | null;
};

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const mapsHref = (a: string) =>
  "https://maps.google.com/?q=" + encodeURIComponent(a + " Carnes Selectas Nayarit");

export default function SucursalesExplorer({
  token,
  sucursales,
  areas,
}: {
  token: string | null;
  sucursales: Sucursal[];
  areas: { key: string; label: string }[];
}) {
  const [q, setQ] = useState("");
  const [area, setArea] = useState<string>(areas[0]?.key ?? "all");

  const mapRef = useRef<import("mapbox-gl").Map | null>(null);
  const markers = useRef<Record<number, import("mapbox-gl").Marker>>({});
  const mapboxRef = useRef<(typeof import("mapbox-gl"))["default"] | null>(null);
  const elRef = useRef<HTMLDivElement>(null);

  const withCoords = useMemo(
    () => sucursales.filter((s) => s.lat != null && s.lng != null),
    [sucursales]
  );

  // What to show in the list + drive the camera
  const visible = useMemo(() => {
    const query = norm(q);
    if (query) {
      return sucursales.filter((s) =>
        norm(`${s.nombre} ${s.direccion ?? ""} ${s.area ?? ""}`).includes(query)
      );
    }
    return sucursales.filter((s) => area === "all" || s.area === area);
  }, [sucursales, q, area]);

  // init map once
  useEffect(() => {
    if (!token || !elRef.current || mapRef.current) return;
    let cancelled = false;
    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      if (cancelled || !elRef.current) return;
      mapboxRef.current = mapboxgl;
      mapboxgl.accessToken = token;
      const map = new mapboxgl.Map({
        container: elRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [-104.89, 21.5],
        zoom: 11,
      });
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
      for (const s of withCoords) {
        const el = document.createElement("div");
        el.style.cssText =
          "width:16px;height:16px;border-radius:50%;background:#C41E3A;border:2px solid #fff;box-shadow:0 0 0 4px rgba(196,30,58,.25);cursor:pointer";
        const popup = new mapboxgl.Popup({ offset: 14, closeButton: false }).setHTML(
          `<div style="font-family:system-ui;color:#1a1a1a"><strong>${s.nombre}</strong>${
            s.direccion ? `<br/><span style="font-size:12px">${s.direccion}</span>` : ""
          }</div>`
        );
        const m = new mapboxgl.Marker(el).setLngLat([s.lng!, s.lat!]).setPopup(popup).addTo(map);
        el.addEventListener("click", () => focus(s.id));
        markers.current[s.id] = m;
      }
      mapRef.current = map;
      map.once("load", () => fitTo(visible));
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // move camera when the visible set changes
  const visKey = visible.map((s) => s.id).join(",");
  useEffect(() => {
    fitTo(visible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visKey]);

  function fitTo(list: Sucursal[]) {
    const map = mapRef.current;
    const mapboxgl = mapboxRef.current;
    if (!map || !mapboxgl) return;
    const pts = list.filter((s) => s.lat != null && s.lng != null);
    if (pts.length === 0) return;
    if (pts.length === 1) {
      map.flyTo({ center: [pts[0].lng!, pts[0].lat!], zoom: 14, duration: 700 });
      return;
    }
    const b = new mapboxgl.LngLatBounds();
    pts.forEach((s) => b.extend([s.lng!, s.lat!]));
    map.fitBounds(b, { padding: 60, maxZoom: 13, duration: 700 });
  }

  function focus(id: number) {
    const s = sucursales.find((x) => x.id === id);
    if (!s || s.lat == null || s.lng == null) return;
    mapRef.current?.flyTo({ center: [s.lng, s.lat], zoom: 15, duration: 800 });
    markers.current[id]?.togglePopup();
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Search */}
      <div className="relative">
        <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-bg-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          type="search"
          placeholder="Busca tu sucursal (nombre, colonia, ciudad)…"
          className="input pl-11"
          aria-label="Buscar sucursales"
        />
      </div>

      {/* Area chips (disabled visual when searching) */}
      <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
        {areas.map((a) => (
          <button
            key={a.key}
            onClick={() => { setQ(""); setArea(a.key); }}
            className={`chip whitespace-nowrap ${!q && area === a.key ? "chip-active" : ""}`}
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* Map */}
      {token && withCoords.length > 0 && (
        <div ref={elRef} className="h-[360px] w-full overflow-hidden rounded-2xl border border-hairline" />
      )}

      {/* List */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">
          {q ? `${visible.length} resultado(s)` : areas.find((a) => a.key === area)?.label}
        </p>
        <span className="text-sm text-on-bg-muted">{visible.length}</span>
      </div>

      {visible.length === 0 ? (
        <p className="py-10 text-center text-on-bg-muted">No encontramos sucursales.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((s) => (
            <article key={s.id} className="glass-card rounded-2xl p-4">
              <button onClick={() => focus(s.id)} className="flex w-full items-start gap-3 text-left">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-sm font-bold text-primary">
                  {String(s.id).padStart(2, "0")}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="flex items-center gap-1 font-bold leading-tight">
                    {s.nombre}
                    <MapPin size={13} className="text-primary/60" />
                  </h3>
                  {s.direccion && (
                    <p className="mt-1 text-sm leading-snug text-on-bg-muted">{s.direccion}</p>
                  )}
                  {s.horario && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-on-bg-muted">
                      <Clock size={12} /> {s.horario}
                    </p>
                  )}
                </div>
              </button>
              <div className="mt-3 flex flex-wrap gap-2">
                {s.whatsapp && (
                  <a href={`https://wa.me/${s.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener" className="btn-primary flex-1 px-2 py-2 text-xs">
                    <MessageCircle size={14} /> WhatsApp
                  </a>
                )}
                {s.telefono && (
                  <a href={`tel:+52${s.telefono.replace(/\D/g, "")}`} className="btn-ghost flex-1 px-2 py-2 text-xs">
                    <Phone size={14} /> {formatPhone(s.telefono)}
                  </a>
                )}
                {s.direccion && (
                  <a href={mapsHref(s.direccion)} target="_blank" rel="noopener" className="btn-ghost flex-1 px-2 py-2 text-xs">
                    <Navigation size={14} /> Cómo llegar
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

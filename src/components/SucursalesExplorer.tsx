// @ts-nocheck
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Phone, Navigation, Clock, MessageCircle, MapPin } from "lucide-react";
import { formatPhone } from "@/lib/format";
import { useT } from "@/components/I18nProvider";

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
  const tr = useT();

  const mapRef = useRef<unknown>(null);
  const markers = useRef<Record<number, unknown>>({});
  const mapboxRef = useRef<unknown>(null);
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

  // init map once — Leaflet + OpenStreetMap
  useEffect(() => {
    if (!elRef.current || mapRef.current) return;
    let cancelled = false;
    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const L = (await import("leaflet")).default as any;
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css"; link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }
      if (cancelled || !elRef.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const map = L.map(elRef.current, { center:[-104.89, 21.5], zoom:11, zoomControl:true, attributionControl:false }) as any;
      mapRef.current = map;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (L.tileLayer as any)("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map as any);
      for (const s of withCoords) {
        const el = document.createElement("div");
        el.style.cssText = "width:16px;height:16px;border-radius:50%;background:#C41E3A;border:2px solid #fff;box-shadow:0 0 0 4px rgba(196,30,58,.25);cursor:pointer";
        const icon = L.divIcon({ html: el, className:"", iconSize:[16,16] as [number,number], iconAnchor:[8,8] as [number,number] });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const m = (L.marker as any)([s.lat!, s.lng!], { icon });
        m.bindPopup(`<div style="font-family:system-ui"><strong>${s.nombre}</strong>${s.direccion ? `<br/><small>${s.direccion}</small>` : ""}${s.telefono ? `<br/><small>📞 ${s.telefono}</small>` : ""}</div>`).addTo(map as any);
        el.addEventListener("click", () => focus(s.id));
        markers.current[s.id] = m;
      }
      setTimeout(() => (map as any).invalidateSize(), 200);
    })();
    return () => {
      cancelled = true;
      (mapRef.current as { remove:()=>void } | null)?.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [withCoords]);

  // move camera when the visible set changes
  const visKey = visible.map((s) => s.id).join(",");
  useEffect(() => {
    fitTo(visible);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visKey]);

  function fitTo(list: Sucursal[]) {
    const map = mapRef.current as { flyTo:(c:[number,number],z:number)=>void; fitBounds:(b:[number,number][], o:object)=>void } | null;
    if (!map) return;
    const pts = list.filter((s) => s.lat != null && s.lng != null);
    if (pts.length === 0) return;
    if (pts.length === 1) {
      map.flyTo([pts[0].lat!, pts[0].lng!], 14);
      return;
    }
    map.fitBounds(pts.map(s => [s.lat!, s.lng!]) as unknown as [number,number][], { padding: [60,60], maxZoom: 13 });
  }

  function focus(id: number) {
    const s = sucursales.find((x) => x.id === id);
    if (!s || s.lat == null || s.lng == null) return;
    (mapRef.current as { flyTo:(c:[number,number],z:number)=>void } | null)?.flyTo([s.lat, s.lng], 15);
    (markers.current[id] as { openPopup:()=>void } | undefined)?.openPopup();
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
          placeholder={tr("suc.searchPlaceholder")}
          className="input pl-11"
          aria-label={tr("suc.searchPlaceholder")}
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
        <p className="py-10 text-center text-on-bg-muted">{tr("suc.none")}</p>
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
                    <MessageCircle size={14} /> {tr("suc.whatsapp")}
                  </a>
                )}
                {s.telefono && (
                  <a href={`tel:+52${s.telefono.replace(/\D/g, "")}`} className="btn-ghost flex-1 px-2 py-2 text-xs">
                    <Phone size={14} /> {formatPhone(s.telefono)}
                  </a>
                )}
                {s.direccion && (
                  <a href={mapsHref(s.direccion)} target="_blank" rel="noopener" className="btn-ghost flex-1 px-2 py-2 text-xs">
                    <Navigation size={14} /> {tr("suc.directions")}
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
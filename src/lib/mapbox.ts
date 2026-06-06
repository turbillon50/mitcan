// Mapbox helpers. The token is read server-side from any of the common env
// names so it works regardless of how it was injected, then passed to the
// client map as a prop.
const TOKEN_ENVS = [
  "NEXT_PUBLIC_MAPBOX_TOKEN",
  "NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN",
  "NEXT_PUBLIC_MAPBOX_API_KEY",
  "MAPBOX_TOKEN",
  "MAPBOX_ACCESS_TOKEN",
  "MAPBOX_API_KEY",
  "MAPBOX_PUBLIC_TOKEN",
];

export function getMapboxToken(): string | null {
  for (const k of TOKEN_ENVS) {
    const v = process.env[k];
    if (v && v.trim()) return v.trim();
  }
  return null;
}

/**
 * CSN service area — Nayarit + Mazatlán (Sinaloa) + Puerto Vallarta (Jalisco).
 * Any branch coordinate MUST fall inside this box; anything outside (e.g. a
 * geocode that drifted to Guadalajara) is rejected so a marker can never land
 * "fuera de área". [minLng, minLat, maxLng, maxLat].
 */
export const SERVICE_BBOX: [number, number, number, number] = [
  -106.8, 20.3, -104.15, 23.45,
];
/** Center used as geocoding proximity bias (Tepic, Nayarit). */
export const SERVICE_CENTER: { lng: number; lat: number } = {
  lng: -104.894,
  lat: 21.504,
};

/** True when [lat,lng] are real numbers inside the CSN service area. */
export function inServiceArea(
  lat: number | null | undefined,
  lng: number | null | undefined
): boolean {
  if (lat == null || lng == null) return false;
  const la = Number(lat);
  const ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return false;
  const [minLng, minLat, maxLng, maxLat] = SERVICE_BBOX;
  return la >= minLat && la <= maxLat && ln >= minLng && ln <= maxLng;
}

/**
 * Geocode an address/place to [lng, lat] using Mapbox, biased to the CSN
 * service area (proximity + bounding box) so ambiguous addresses resolve to the
 * local branch and not a same-named street in another state. Returns null on a
 * miss or when the result falls outside the service area.
 */
export async function geocode(
  query: string,
  token: string
): Promise<{ lng: number; lat: number } | null> {
  try {
    const [minLng, minLat, maxLng, maxLat] = SERVICE_BBOX;
    const url =
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json` +
      `?access_token=${token}&country=mx&limit=1&language=es` +
      `&proximity=${SERVICE_CENTER.lng},${SERVICE_CENTER.lat}` +
      `&bbox=${minLng},${minLat},${maxLng},${maxLat}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { features?: { center?: [number, number] }[] };
    const center = data.features?.[0]?.center;
    if (!center || center.length !== 2) return null;
    const [lng, lat] = center;
    // Final guard: never return a point outside the service area.
    if (!inServiceArea(lat, lng)) return null;
    return { lng, lat };
  } catch {
    return null;
  }
}

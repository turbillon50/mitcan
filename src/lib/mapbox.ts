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

/** Geocode an address/place to [lng, lat] using Mapbox. Returns null on miss. */
export async function geocode(
  query: string,
  token: string
): Promise<{ lng: number; lat: number } | null> {
  try {
    const url =
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json` +
      `?access_token=${token}&country=mx&limit=1&language=es`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { features?: { center?: [number, number] }[] };
    const center = data.features?.[0]?.center;
    if (!center || center.length !== 2) return null;
    return { lng: center[0], lat: center[1] };
  } catch {
    return null;
  }
}

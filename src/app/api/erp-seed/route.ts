import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMapboxToken, geocode } from "@/lib/mapbox";

// TEMPORARY: apply ERP schema additions + seed the 24 real branches and 10
// products (geocoded). Idempotent. Removed after running.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const KEY = "csn-seed-2026";

const DDL = [
  `ALTER TABLE sucursales ADD COLUMN IF NOT EXISTS whatsapp text;`,
  `ALTER TABLE productos ADD COLUMN IF NOT EXISTS sku text;`,
  `ALTER TABLE productos ADD COLUMN IF NOT EXISTS es_nuevo boolean DEFAULT false;`,
  `ALTER TABLE promociones ADD COLUMN IF NOT EXISTS precio_promo numeric;`,
  `ALTER TABLE promociones ADD COLUMN IF NOT EXISTS unidad text;`,
  `ALTER TABLE promociones ADD COLUMN IF NOT EXISTS orden integer DEFAULT 0;`,
  `ALTER TABLE promociones ADD COLUMN IF NOT EXISTS sucursales text[] DEFAULT '{}';`,
  `CREATE TABLE IF NOT EXISTS precios_sucursal (
     id serial PRIMARY KEY,
     producto_id integer NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
     sucursal_id integer NOT NULL REFERENCES sucursales(id) ON DELETE CASCADE,
     precio numeric,
     activo boolean DEFAULT true,
     created_at timestamptz DEFAULT now(),
     updated_at timestamptz DEFAULT now(),
     UNIQUE (producto_id, sucursal_id)
   );`,
  `CREATE TABLE IF NOT EXISTS content_blocks (
     id serial PRIMARY KEY,
     key text UNIQUE NOT NULL,
     content jsonb,
     updated_at timestamptz DEFAULT now()
   );`,
];

const SUC: { n: string; area: string; d: string; t: string }[] = [
  { n: "Xalisco", area: "tepic", d: "Av. Hidalgo Sur 43 b, Xalisco Centro, 63780 Xalisco, Nay.", t: "3113413508" },
  { n: "Nayarabastos", area: "tepic", d: "Tetewa 7, Nayarabastos, 63173 Tepic, Nay.", t: "3112115253" },
  { n: "México", area: "tepic", d: "Av. México Nte. 852, Lomas de la Cruz, 63037 Tepic, Nay.", t: "3112460595" },
  { n: "Rodeo Insurgentes", area: "tepic", d: "De Los Insurgentes Pte. 864, 20 de Noviembre, 63137 Tepic, Nay.", t: "3111411874" },
  { n: "Cantera", area: "tepic", d: "Villa de Leon 660, 63173 Tepic, Nay.", t: "3112530630" },
  { n: "Ejido", area: "tepic", d: "Ejido 873, Santa Cecilia, 63089 Tepic, Nay.", t: "3119097987" },
  { n: "Real del Valle", area: "mazatlan", d: "Av Óscar Pérez Escobosa 6006-int 3, Fracc Real Pacífico, 82124 Mazatlán, Sin.", t: "6691770881" },
  { n: "Parque Lineal", area: "mazatlan", d: "Av. Lib. Núm. 2 Pte. 112, Los Conchis Secc Arrecifes, 82139 Mazatlán, Sin.", t: "6692628454" },
  { n: "Ejército Mexicano", area: "mazatlan", d: "Internacional Supermanzana México Km 2 #3019, Periodista, 82120 Mazatlán, Sin.", t: "6693307713" },
  { n: "Mercado Juárez", area: "mazatlan", d: "Internacional & 13 de Abril, Benito Juárez, 82180 Mazatlán, Sin.", t: "6692704678" },
  { n: "Pitillal", area: "vallarta", d: "C. Independencia 88, Bobadilla, 48298 Puerto Vallarta, Jal.", t: "3223801423" },
  { n: "Fluvial", area: "vallarta", d: "De Los Tules 168-local 4, Jardines de Vallarta, 48328 Puerto Vallarta, Jal.", t: "3221556573" },
  { n: "Mojoneras", area: "vallarta", d: "Av. México 223, Parque Las Palmas, 48290 Puerto Vallarta, Jal.", t: "3224335824" },
  { n: "Poetas", area: "vallarta", d: "De Los Poetas 2266 esq Perú, Lomas de Enmedio, 48290 Puerto Vallarta, Jal.", t: "3223790706" },
  { n: "Romántica", area: "vallarta", d: "Aguacate 157, Zona Romántica, Emiliano Zapata, 48380 Puerto Vallarta, Jal.", t: "3223652020" },
  { n: "Ixtapa", area: "vallarta", d: "Carr a las Palmas 1545, Los Tamarindos, 48280 Ixtapa, Jal.", t: "3228896778" },
  { n: "Mezcales", area: "bahia", d: "Blvrd Riviera Nayarit 110, Centro, 63735 Mezcales, Nay.", t: "3223077861" },
  { n: "Bucerías", area: "bahia", d: "Av. Héroes de Nacozari 73, Flamingos, 63732 Bucerías, Nay.", t: "3222016782" },
  { n: "Santa Fe", area: "bahia", d: "Calle Sta. Aurora, Fracc Santa Fe, 63737 San José del Valle, Nay.", t: "3223731771" },
  { n: "San Vicente", area: "bahia", d: "12 de Octubre 75, San Vicente, 63737 San Vicente, Nay.", t: "3112049779" },
  { n: "Santiago", area: "foraneas", d: "20 de Noviembre Ote 149, Centro, 63300 Santiago Ixcuintla, Nay.", t: "3231753821" },
  { n: "La Peñita", area: "foraneas", d: "Allende 40, Lázaro Cárdenas, 63720 La Peñita de Jaltemba, Nay.", t: "3112531490" },
  { n: "Villa Hidalgo", area: "foraneas", d: "Ejido 26, Centro, 63550 Villa Hidalgo, Nay.", t: "3111361968" },
  { n: "Ixtlán del Río", area: "foraneas", d: "C. Hidalgo 616, Los Arcos, 63958 Ixtlán del Río, Nay.", t: "3112703149" },
];

const PROD: { n: string; precio: number; unidad: string; nuevo: boolean; sku: string }[] = [
  { n: "Tasajo de Sirloin", precio: 196.9, unidad: "kg", nuevo: false, sku: "CSN-TASAJO-SIRLOIN" },
  { n: "Carne para Birria", precio: 126.9, unidad: "kg", nuevo: false, sku: "CSN-BIRRIA" },
  { n: "Arrachera Marinada", precio: 109.9, unidad: "kg", nuevo: false, sku: "CSN-ARRACHERA-MAR" },
  { n: "Chicharrón Estilo Norteño", precio: 129.9, unidad: "pza", nuevo: true, sku: "CSN-CHICHARRON" },
  { n: "Chorizo Argentino para Asar P4OSA", precio: 65.9, unidad: "pza", nuevo: true, sku: "CSN-CHORIZO-ARG" },
  { n: "Queso Oaxaca Los Abuelos", precio: 109.9, unidad: "kg", nuevo: true, sku: "CSN-QUESO-OAXACA" },
  { n: "Picaña Marinada", precio: 109.9, unidad: "kg", nuevo: false, sku: "CSN-PICANA-MAR" },
  { n: "Pollo Fresco", precio: 54.9, unidad: "kg", nuevo: false, sku: "CSN-POLLO-FRESCO" },
  { n: "Chamorro de Cerdo", precio: 48.9, unidad: "kg", nuevo: false, sku: "CSN-CHAMORRO-CERDO" },
  { n: "Pechuga S/N Congelada", precio: 72.9, unidad: "kg", nuevo: false, sku: "CSN-PECHUGA-CONG" },
];

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("key") !== KEY) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const out: Record<string, unknown> = {};

  // 1) schema
  const ddl: Record<string, string> = {};
  for (let i = 0; i < DDL.length; i++) {
    try {
      await prisma.$executeRawUnsafe(DDL[i]);
      ddl[`step${i}`] = "ok";
    } catch (e) {
      ddl[`step${i}`] = "err: " + String((e as Error)?.message ?? e);
    }
  }
  out.ddl = ddl;

  // 2) sucursales (upsert by nombre + geocode), deactivate the rest
  const token = getMapboxToken();
  const names = SUC.map((s) => s.n);
  let geocoded = 0;
  for (const s of SUC) {
    const wa = "52" + s.t.replace(/\D/g, "");
    const existing = await prisma.sucursales.findFirst({ where: { nombre: s.n } });
    let row;
    if (existing) {
      row = await prisma.sucursales.update({
        where: { id: existing.id },
        data: { area: s.area, direccion: s.d, telefono: s.t, whatsapp: wa, activa: true },
      });
    } else {
      row = await prisma.sucursales.create({
        data: { nombre: s.n, area: s.area, direccion: s.d, telefono: s.t, whatsapp: wa, activa: true },
      });
    }
    if (token && (row.lat == null || row.lng == null)) {
      const g = await geocode(`${s.d}`, token);
      if (g) {
        await prisma.sucursales.update({ where: { id: row.id }, data: { lat: g.lat, lng: g.lng } });
        geocoded++;
      }
    }
  }
  await prisma.sucursales.updateMany({ where: { nombre: { notIn: names } }, data: { activa: false } });
  out.sucursales = { total: SUC.length, geocoded, mapbox: token ? "present" : "MISSING" };

  // 3) productos (upsert by nombre)
  let pUp = 0;
  for (const p of PROD) {
    const existing = await prisma.productos.findFirst({ where: { nombre: p.n } });
    if (existing) {
      await prisma.productos.update({
        where: { id: existing.id },
        data: { precio: p.precio, unidad: p.unidad, es_nuevo: p.nuevo, sku: p.sku, activo: true },
      });
    } else {
      await prisma.productos.create({
        data: {
          nombre: p.n,
          slug: slugify(p.n),
          precio: p.precio,
          unidad: p.unidad,
          es_nuevo: p.nuevo,
          sku: p.sku,
          activo: true,
        },
      });
    }
    pUp++;
  }
  out.productos = { upserted: pUp };

  const finalSuc = await prisma.sucursales.count({ where: { activa: true } });
  out.sucursalesActivas = finalSuc;

  return new NextResponse(JSON.stringify(out, null, 2), {
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

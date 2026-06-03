import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import catalogo from "@/data/catalogo.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* TEMP key-gated endpoint to load the REAL POS catalog into the live DB.
 * Remove after the one-time seed.  Call:
 *   /api/catalog-seed?key=csn-cat-2026&phase=cats
 *   /api/catalog-seed?key=csn-cat-2026&phase=prods&offset=0&limit=200  (repeat)
 */
const KEY = "csn-cat-2026";

type Row = {
  sku: string;
  nombre: string;
  slug: string;
  categoria: string;
  precio: number;
  unidad: string;
  stock: number;
};
const ROWS = catalogo as Row[];

// Icon + display order per category (icono is a free-text string column).
const CAT_META: Record<string, { icono: string; orden: number }> = {
  "CARNICO DE RES": { icono: "🥩", orden: 1 },
  "CARNICO DE CERDO": { icono: "🐖", orden: 2 },
  "CARNICO DE POLLO": { icono: "🍗", orden: 3 },
  "CARNES EXOTICAS": { icono: "🦌", orden: 4 },
  "PESCADOS Y MARISCOS": { icono: "🐟", orden: 5 },
  PROCESADOS: { icono: "🍖", orden: 6 },
  EMBUTIDOS: { icono: "🌭", orden: 7 },
  LACTEOS: { icono: "🧀", orden: 8 },
  CONGELADOS: { icono: "🧊", orden: 9 },
  ABARROTES: { icono: "🛒", orden: 10 },
  BEBIDAS: { icono: "🥤", orden: 11 },
  VINO: { icono: "🍷", orden: 12 },
  ESPECIES: { icono: "🌶️", orden: 13 },
  "TOSTADAS Y TOTOPOS": { icono: "🌮", orden: 14 },
  DESECHABLE: { icono: "🧺", orden: 15 },
  INSUMOS: { icono: "📦", orden: 16 },
  MASCOTAS: { icono: "🐶", orden: 17 },
  SOUVENIRS: { icono: "🎁", orden: 18 },
};

function slugCat(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("key") !== KEY) {
    return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  }
  const phase = url.searchParams.get("phase") ?? "cats";

  try {
    if (phase === "cats") {
      // 1) upsert categorias by nombre
      const nombres = [...new Set(ROWS.map((r) => r.categoria))];
      const existing = await prisma.categorias.findMany();
      const byName = new Map(existing.map((c) => [c.nombre, c]));
      const usedSlugs = new Set(existing.map((c) => c.slug));
      let creadas = 0;
      let actualizadas = 0;
      for (const nombre of nombres) {
        const meta = CAT_META[nombre] ?? { icono: "🏷️", orden: 99 };
        const found = byName.get(nombre);
        if (found) {
          await prisma.categorias.update({
            where: { id: found.id },
            data: { icono: meta.icono, orden: meta.orden, activa: true },
          });
          actualizadas++;
        } else {
          let slug = slugCat(nombre);
          let n = 2;
          while (usedSlugs.has(slug)) slug = `${slugCat(nombre)}-${n++}`;
          usedSlugs.add(slug);
          await prisma.categorias.create({
            data: { nombre, slug, icono: meta.icono, orden: meta.orden, activa: true },
          });
          creadas++;
        }
      }
      // 2) deactivate the old demo CSN-* placeholder products
      const demo = await prisma.productos.updateMany({
        where: { sku: { startsWith: "CSN-" } },
        data: { activo: false },
      });
      return NextResponse.json({
        phase,
        categorias_creadas: creadas,
        categorias_actualizadas: actualizadas,
        demo_desactivados: demo.count,
        total_productos_en_archivo: ROWS.length,
      });
    }

    if (phase === "prods") {
      const offset = Number(url.searchParams.get("offset") ?? "0");
      const limit = Number(url.searchParams.get("limit") ?? "200");
      const slice = ROWS.slice(offset, offset + limit);

      // resolve categoria name -> id
      const cats = await prisma.categorias.findMany();
      const catId = new Map(cats.map((c) => [c.nombre, c.id]));

      // central warehouse branch (Nayarabastos = abastos central) for stock
      const central = await prisma.sucursales.findFirst({
        where: { nombre: { contains: "abasto", mode: "insensitive" } },
      });

      let creados = 0;
      let actualizados = 0;
      let conStock = 0;
      const errores: { sku: string; error: string }[] = [];

      for (const r of slice) {
        try {
          const categoria_id = catId.get(r.categoria) ?? null;
          const existing = await prisma.productos.findUnique({
            where: { sku: r.sku },
          });
          let prodId: number;
          if (existing) {
            await prisma.productos.update({
              where: { id: existing.id },
              data: {
                nombre: r.nombre,
                precio: r.precio,
                unidad: r.unidad,
                categoria_id,
                activo: true,
              },
            });
            prodId = existing.id;
            actualizados++;
          } else {
            const created = await prisma.productos.create({
              data: {
                nombre: r.nombre,
                slug: r.slug,
                sku: r.sku,
                precio: r.precio,
                unidad: r.unidad,
                categoria_id,
                activo: true,
              },
            });
            prodId = created.id;
            creados++;
          }

          if (central && r.stock > 0) {
            const inv = await prisma.inventario.findFirst({
              where: { producto_id: prodId, sucursal_id: central.id },
            });
            if (inv) {
              await prisma.inventario.update({
                where: { id: inv.id },
                data: { stock: r.stock, fuente: "manual", updated_at: new Date() },
              });
            } else {
              await prisma.inventario.create({
                data: {
                  producto_id: prodId,
                  sucursal_id: central.id,
                  stock: r.stock,
                  fuente: "manual",
                },
              });
            }
            conStock++;
          }
        } catch (e) {
          errores.push({ sku: r.sku, error: String((e as Error)?.message ?? e) });
        }
      }

      const next = offset + limit;
      return NextResponse.json({
        phase,
        offset,
        procesados: slice.length,
        creados,
        actualizados,
        con_stock_central: conStock,
        central: central?.nombre ?? null,
        errores,
        next: next < ROWS.length ? next : null,
        total: ROWS.length,
      });
    }

    if (phase === "cleanup") {
      // Deactivate leftover demo products: real catalog SKUs are numeric,
      // so anything active without a numeric SKU is stale demo data.
      const activos = await prisma.productos.findMany({
        where: { activo: true },
        select: { id: true, sku: true, nombre: true },
      });
      const stale = activos.filter((p) => !p.sku || !/^\d+$/.test(p.sku));
      if (stale.length) {
        await prisma.productos.updateMany({
          where: { id: { in: stale.map((p) => p.id) } },
          data: { activo: false },
        });
      }
      // Also deactivate empty demo categorias (no active products left)
      const catsConActivos = await prisma.productos.findMany({
        where: { activo: true, categoria_id: { not: null } },
        select: { categoria_id: true },
        distinct: ["categoria_id"],
      });
      const usadas = new Set(catsConActivos.map((c) => c.categoria_id));
      const catsDesactivadas = await prisma.categorias.updateMany({
        where: { activa: true, id: { notIn: [...usadas] as number[] } },
        data: { activa: false },
      });
      const restantes = await prisma.productos.count({ where: { activo: true } });
      return NextResponse.json({
        phase,
        desactivados: stale.length,
        nombres: stale.map((p) => p.nombre),
        categorias_desactivadas: catsDesactivadas.count,
        productos_activos_restantes: restantes,
      });
    }

    return NextResponse.json({ error: "phase desconocida" }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: String((e as Error)?.message ?? e) },
      { status: 500 }
    );
  }
}

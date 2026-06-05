"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMapboxToken, geocode } from "@/lib/mapbox";
import { sendEmail, notificacionEmail } from "@/lib/resend";
import { sendPushToAll, sendPushToUser } from "@/lib/push";
import type { user_role } from "@prisma/client";

function num(v: FormDataEntryValue | null, def = 0) {
  const n = parseFloat((v as string) ?? "");
  return Number.isFinite(n) ? n : def;
}
function str(v: FormDataEntryValue | null) {
  const s = (v as string)?.trim();
  return s ? s : null;
}
function bool(v: FormDataEntryValue | null) {
  return v === "on" || v === "true" || v === "1";
}
function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/* ---------------- Sucursales ---------------- */
export async function saveSucursal(formData: FormData) {
  await requireAdmin();
  const id = num(formData.get("id"), 0);
  const direccion = str(formData.get("direccion"));
  const area = str(formData.get("area")) ?? "tepic"; // area is NOT NULL in the DB
  const nombre = str(formData.get("nombre")) ?? "Sucursal";

  let lat: number | null = formData.get("lat") ? num(formData.get("lat")) : null;
  let lng: number | null = formData.get("lng") ? num(formData.get("lng")) : null;

  // Auto-geocode when coordinates aren't provided but we have something to locate.
  if ((lat == null || lng == null)) {
    const token = getMapboxToken();
    const query = direccion ?? `${nombre}, ${area}, Nayarit, México`;
    if (token && query) {
      const geo = await geocode(query, token);
      if (geo) {
        lat = geo.lat;
        lng = geo.lng;
      }
    }
  }

  const data = {
    nombre,
    area,
    direccion,
    telefono: str(formData.get("telefono")),
    horario: str(formData.get("horario")) ?? undefined,
    lat,
    lng,
    activa: bool(formData.get("activa")),
  };
  if (id) await prisma.sucursales.update({ where: { id }, data });
  else await prisma.sucursales.create({ data });
  revalidatePath("/admin/sucursales");
  revalidatePath("/admin/c4");
  revalidatePath("/sucursales");
}

export async function deleteSucursal(id: number) {
  await requireAdmin();
  // Detach/clean dependent rows first so the FK constraints don't blow up.
  await prisma.$transaction([
    prisma.inventario.deleteMany({ where: { sucursal_id: id } }),
    prisma.precios_sucursal.deleteMany({ where: { sucursal_id: id } }),
    prisma.promociones.updateMany({ where: { sucursal_id: id }, data: { sucursal_id: null } }),
    prisma.pedidos.updateMany({ where: { sucursal_id: id }, data: { sucursal_id: null } }),
    prisma.users.updateMany({ where: { sucursal_id: id }, data: { sucursal_id: null } }),
    prisma.content_blocks.deleteMany({ where: { key: `c4_cam_${id}` } }),
    prisma.sucursales.delete({ where: { id } }),
  ]);
  revalidatePath("/admin/sucursales");
  revalidatePath("/admin/c4");
  revalidatePath("/sucursales");
}

/* ---------------- Productos ---------------- */
export async function saveProducto(formData: FormData) {
  await requireAdmin();
  const id = num(formData.get("id"), 0);
  const categoria_id = num(formData.get("categoria_id"), 0) || null;
  const nombre = str(formData.get("nombre")) ?? "Producto";

  // Gallery: JSON array of URLs; the cover (first) is mirrored into imagen_url.
  let imagenes: string[] = [];
  try {
    const raw = formData.get("imagenes");
    if (typeof raw === "string" && raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) imagenes = parsed.filter((u) => typeof u === "string" && u);
    }
  } catch {
    imagenes = [];
  }
  const cover = imagenes[0] ?? str(formData.get("imagen_url"));

  const data = {
    nombre,
    descripcion: str(formData.get("descripcion")),
    categoria_id,
    precio: num(formData.get("precio")),
    unidad: str(formData.get("unidad")) ?? "kg",
    imagen_url: cover,
    imagenes,
    es_nuevo: bool(formData.get("es_nuevo")),
    activo: bool(formData.get("activo")),
  };
  if (id) await prisma.productos.update({ where: { id }, data });
  // slug is NOT NULL on create
  else await prisma.productos.create({ data: { ...data, slug: slugify(nombre) || `producto-${Date.now()}` } });
  revalidatePath("/admin/productos");
  revalidatePath("/catalogo");
}

/** Copy a branch's stock (stock + min) as a baseline to every other active
 *  branch. Idempotent when soloVacias=true (skips products a branch already
 *  has), so it can be re-run to finish if it times out. */
export async function replicarInventario(fromSucursalId: number, soloVacias = true) {
  await requireAdmin();
  const source = await prisma.inventario.findMany({
    where: { sucursal_id: fromSucursalId, producto_id: { not: null } },
  });
  if (!source.length) return { ok: false, copiados: 0 };

  const branches = await prisma.sucursales.findMany({ where: { activa: true } });
  const targets = branches.filter((b) => b.id !== fromSucursalId);
  let copiados = 0;

  for (const t of targets) {
    const existing = await prisma.inventario.findMany({
      where: { sucursal_id: t.id },
      select: { producto_id: true },
    });
    const have = new Set(existing.map((e) => e.producto_id));
    for (const r of source) {
      if (soloVacias && have.has(r.producto_id)) continue;
      const upd = await prisma.inventario.updateMany({
        where: { producto_id: r.producto_id!, sucursal_id: t.id },
        data: { stock: r.stock, min_stock: r.min_stock, updated_at: new Date() },
      });
      if (upd.count === 0) {
        await prisma.inventario.create({
          data: {
            producto_id: r.producto_id,
            sucursal_id: t.id,
            stock: r.stock,
            min_stock: r.min_stock,
            fuente: "manual",
          },
        });
      }
      copiados++;
    }
  }
  revalidatePath("/admin/inventario");
  revalidatePath("/admin/c4");
  return { ok: true, copiados, sucursales: targets.length };
}

export async function deleteProducto(id: number) {
  await requireAdmin();
  // Detach/clean dependent rows first so the FK constraints don't blow up.
  await prisma.$transaction([
    prisma.inventario.deleteMany({ where: { producto_id: id } }),
    prisma.precios_sucursal.deleteMany({ where: { producto_id: id } }),
    prisma.promociones.updateMany({ where: { producto_id: id }, data: { producto_id: null } }),
    prisma.pedido_items.updateMany({ where: { producto_id: id }, data: { producto_id: null } }),
    prisma.productos.delete({ where: { id } }),
  ]);
  revalidatePath("/admin/productos");
  revalidatePath("/admin/c4");
  revalidatePath("/catalogo");
}

/* ---------------- C4: cámaras por sucursal ---------------- */
export type Camara = { nombre: string; url: string };

export async function saveCamaras(sucursalId: number, camaras: Camara[]) {
  await requireAdmin();
  const key = `c4_cam_${sucursalId}`;
  const content = camaras
    .filter((c) => c && c.url)
    .map((c) => ({ nombre: (c.nombre || "Cámara").slice(0, 60), url: c.url.slice(0, 500) }));
  await prisma.content_blocks.upsert({
    where: { key },
    update: { content, updated_at: new Date() },
    create: { key, content },
  });
  revalidatePath("/admin/c4");
  return { ok: true, total: content.length };
}

/* ---------------- Recompensas ---------------- */
export async function saveRecompensa(formData: FormData) {
  await requireAdmin();
  const id = num(formData.get("id"), 0);
  const data = {
    nombre: str(formData.get("nombre")) ?? "Recompensa",
    descripcion: str(formData.get("descripcion")),
    tipo: str(formData.get("tipo")) ?? "descuento",
    puntos_requeridos: Math.round(num(formData.get("puntos_requeridos"))),
    imagen_url: str(formData.get("imagen_url")),
    valor: formData.get("valor") ? num(formData.get("valor")) : null,
    activa: bool(formData.get("activa")),
  };
  if (id) await prisma.recompensas.update({ where: { id }, data });
  else await prisma.recompensas.create({ data });
  revalidatePath("/admin/recompensas");
}

export async function deleteRecompensa(id: number) {
  await requireAdmin();
  await prisma.recompensas.delete({ where: { id } });
  revalidatePath("/admin/recompensas");
}

/* ---------------- Pedidos ---------------- */
export async function updatePedidoEstado(id: number, estado: string) {
  await requireAdmin();
  await prisma.pedidos.update({ where: { id }, data: { estado } });
  revalidatePath("/admin/pedidos");
  revalidatePath("/admin");
}

/* ---------------- Inventario (stock + precio por sucursal) ---------------- */
export async function upsertInventario(
  producto_id: number,
  sucursal_id: number,
  stock: number,
  min_stock: number,
  precio: number | null
) {
  await requireAdmin();
  // No DB-level unique on (producto_id, sucursal_id), so update-or-create.
  const data = { stock, min_stock, precio, updated_at: new Date() };
  const updated = await prisma.inventario.updateMany({
    where: { producto_id, sucursal_id },
    data,
  });
  if (updated.count === 0) {
    await prisma.inventario.create({
      data: { producto_id, sucursal_id, stock, min_stock, precio },
    });
  }
  revalidatePath("/admin/inventario");
  revalidatePath("/catalogo");
}

/* ---------------- Usuarios (roles) ---------------- */
export async function updateUserRol(id: string, rol: user_role) {
  const admin = await requireAdmin();
  // Only full admins may change roles.
  if (!isAdmin(admin.rol)) throw new Error("No autorizado");
  await prisma.users.update({ where: { id }, data: { rol } });
  revalidatePath("/admin/usuarios");
}

/* ---------------- Categorías ---------------- */
export async function saveCategoria(formData: FormData) {
  await requireAdmin();
  const id = num(formData.get("id"), 0);
  const nombre = str(formData.get("nombre")) ?? "Categoría";
  const slug = str(formData.get("slug")) ?? slugify(nombre) ?? `cat-${Date.now()}`;
  const data = {
    nombre,
    slug,
    icono: str(formData.get("icono")),
    orden: Math.round(num(formData.get("orden"))),
    activa: bool(formData.get("activa")),
  };
  if (id) await prisma.categorias.update({ where: { id }, data });
  else await prisma.categorias.create({ data });
  revalidatePath("/admin/categorias");
  revalidatePath("/catalogo");
}

export async function deleteCategoria(id: number) {
  await requireAdmin();
  await prisma.categorias.delete({ where: { id } });
  revalidatePath("/admin/categorias");
  revalidatePath("/catalogo");
}

/* ---------------- Redenciones ---------------- */
export async function updateRedencionEstado(id: number, estado: string) {
  await requireAdmin();
  await prisma.redenciones.update({ where: { id }, data: { estado } });
  revalidatePath("/admin/redenciones");
}

/* ---------------- Notificaciones ---------------- */
export async function enviarNotificacion(formData: FormData) {
  await requireAdmin();
  const titulo = str(formData.get("titulo")) ?? "Aviso CSN";
  const mensaje = str(formData.get("mensaje")) ?? "";
  const tipo = str(formData.get("tipo")) ?? "general";
  const destino = str(formData.get("destino")); // email específico o null = todos

  const enviarEmail = bool(formData.get("email"));

  let recipients: { id: string; email: string | null }[] = [];
  if (destino) {
    const u = await prisma.users.findFirst({ where: { email: destino } });
    if (u) recipients = [{ id: u.id, email: u.email }];
  } else {
    recipients = await prisma.users.findMany({ select: { id: true, email: true } });
  }

  if (recipients.length) {
    await prisma.notificaciones.createMany({
      data: recipients.map((u) => ({ user_id: u.id, titulo, mensaje, tipo })),
    });

    // Best-effort email blast (cap to avoid timeouts).
    if (enviarEmail) {
      const emails = recipients.map((u) => u.email).filter((e): e is string => !!e).slice(0, 300);
      const html = notificacionEmail(titulo, mensaje);
      await Promise.allSettled(
        emails.map((to) => sendEmail({ to, subject: titulo, html }))
      );
    }

    // Best-effort web push (no-op until VAPID keys are configured).
    const payload = { title: titulo, body: mensaje, url: "/app/notificaciones" };
    if (destino && recipients[0]) {
      await sendPushToUser(recipients[0].id, payload).catch(() => null);
    } else {
      await sendPushToAll(payload).catch(() => null);
    }
  }
  revalidatePath("/admin/notificaciones");
  revalidatePath("/app/notificaciones");
}

export async function deleteNotificacion(id: number) {
  await requireAdmin();
  await prisma.notificaciones.delete({ where: { id } });
  revalidatePath("/admin/notificaciones");
}

/* ---------------- Precios por sucursal ---------------- */
export async function savePreciosBatch(
  items: { producto_id: number; sucursal_id: number; precio: number | null }[]
) {
  await requireAdmin();
  for (const it of items) {
    if (it.precio == null || !Number.isFinite(it.precio)) {
      await prisma.precios_sucursal.deleteMany({
        where: { producto_id: it.producto_id, sucursal_id: it.sucursal_id },
      });
    } else {
      const existing = await prisma.precios_sucursal.findFirst({
        where: { producto_id: it.producto_id, sucursal_id: it.sucursal_id },
      });
      if (existing) {
        await prisma.precios_sucursal.update({
          where: { id: existing.id },
          data: { precio: it.precio, updated_at: new Date() },
        });
      } else {
        await prisma.precios_sucursal.create({
          data: { producto_id: it.producto_id, sucursal_id: it.sucursal_id, precio: it.precio },
        });
      }
    }
  }
  revalidatePath("/admin/precios");
  revalidatePath("/catalogo");
  return { ok: true };
}

/* ---------------- Promociones ---------------- */
export async function savePromocion(formData: FormData) {
  await requireAdmin();
  const id = num(formData.get("id"), 0);
  const inicio = str(formData.get("fecha_inicio"));
  const fin = str(formData.get("fecha_fin"));
  // "todas" or a list of sucursal IDs (checkbox name="suc")
  const sucSel = formData.getAll("suc").map(String).filter(Boolean);
  const todas = formData.get("todas") === "on" || sucSel.length === 0;
  const data = {
    titulo: str(formData.get("titulo")) ?? "Promoción",
    descripcion: str(formData.get("descripcion")),
    tipo: str(formData.get("tipo")) ?? "descuento",
    valor: formData.get("valor") ? num(formData.get("valor")) : null,
    precio_promo: formData.get("precio_promo") ? num(formData.get("precio_promo")) : null,
    unidad: str(formData.get("unidad")),
    producto_id: num(formData.get("producto_id"), 0) || null,
    sucursales: todas ? ["todas"] : sucSel,
    fecha_inicio: inicio ? new Date(inicio) : null,
    fecha_fin: fin ? new Date(fin) : null,
    imagen_url: str(formData.get("imagen_url")),
    activa: bool(formData.get("activa")),
  };
  if (id) await prisma.promociones.update({ where: { id }, data });
  else
    await prisma.promociones.create({
      data: { ...data, orden: (await prisma.promociones.count()) },
    });
  revalidatePath("/admin/promociones");
  revalidatePath("/");
}

export async function reordenarPromos(ids: number[]) {
  await requireAdmin();
  await prisma.$transaction(
    ids.map((id, i) => prisma.promociones.update({ where: { id }, data: { orden: i } }))
  );
  revalidatePath("/admin/promociones");
  revalidatePath("/");
  return { ok: true };
}

export async function deletePromocion(id: number) {
  await requireAdmin();
  await prisma.promociones.delete({ where: { id } });
  revalidatePath("/admin/promociones");
  revalidatePath("/");
}

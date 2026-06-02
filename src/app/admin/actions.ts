"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
  const data = {
    nombre: str(formData.get("nombre")) ?? "Sucursal",
    area: str(formData.get("area")) ?? "tepic", // area is NOT NULL in the DB
    direccion: str(formData.get("direccion")),
    telefono: str(formData.get("telefono")),
    horario: str(formData.get("horario")) ?? undefined,
    activa: bool(formData.get("activa")),
  };
  if (id) await prisma.sucursales.update({ where: { id }, data });
  else await prisma.sucursales.create({ data });
  revalidatePath("/admin/sucursales");
  revalidatePath("/sucursales");
}

export async function deleteSucursal(id: number) {
  await requireAdmin();
  await prisma.sucursales.delete({ where: { id } });
  revalidatePath("/admin/sucursales");
  revalidatePath("/sucursales");
}

/* ---------------- Productos ---------------- */
export async function saveProducto(formData: FormData) {
  await requireAdmin();
  const id = num(formData.get("id"), 0);
  const categoria_id = num(formData.get("categoria_id"), 0) || null;
  const nombre = str(formData.get("nombre")) ?? "Producto";
  const data = {
    nombre,
    descripcion: str(formData.get("descripcion")),
    categoria_id,
    precio: num(formData.get("precio")),
    unidad: str(formData.get("unidad")) ?? "kg",
    imagen_url: str(formData.get("imagen_url")),
    activo: bool(formData.get("activo")),
  };
  if (id) await prisma.productos.update({ where: { id }, data });
  // slug is NOT NULL on create
  else await prisma.productos.create({ data: { ...data, slug: slugify(nombre) || `producto-${Date.now()}` } });
  revalidatePath("/admin/productos");
  revalidatePath("/catalogo");
}

export async function deleteProducto(id: number) {
  await requireAdmin();
  await prisma.productos.delete({ where: { id } });
  revalidatePath("/admin/productos");
  revalidatePath("/catalogo");
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

/* ---------------- Inventario ---------------- */
export async function upsertInventario(
  producto_id: number,
  sucursal_id: number,
  stock: number,
  min_stock: number
) {
  await requireAdmin();
  // No DB-level unique on (producto_id, sucursal_id), so update-or-create.
  const updated = await prisma.inventario.updateMany({
    where: { producto_id, sucursal_id },
    data: { stock, min_stock, updated_at: new Date() },
  });
  if (updated.count === 0) {
    await prisma.inventario.create({
      data: { producto_id, sucursal_id, stock, min_stock },
    });
  }
  revalidatePath("/admin/inventario");
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

  let userIds: string[] = [];
  if (destino) {
    const u = await prisma.users.findFirst({ where: { email: destino } });
    if (u) userIds = [u.id];
  } else {
    const all = await prisma.users.findMany({ select: { id: true } });
    userIds = all.map((u) => u.id);
  }

  if (userIds.length) {
    await prisma.notificaciones.createMany({
      data: userIds.map((uid) => ({ user_id: uid, titulo, mensaje, tipo })),
    });
  }
  revalidatePath("/admin/notificaciones");
}

export async function deleteNotificacion(id: number) {
  await requireAdmin();
  await prisma.notificaciones.delete({ where: { id } });
  revalidatePath("/admin/notificaciones");
}

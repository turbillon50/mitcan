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

/* ---------------- Sucursales ---------------- */
export async function saveSucursal(formData: FormData) {
  await requireAdmin();
  const id = num(formData.get("id"), 0);
  const data = {
    nombre: str(formData.get("nombre")) ?? "Sucursal",
    area: str(formData.get("area")),
    direccion: str(formData.get("direccion")),
    telefono: str(formData.get("telefono")),
    horario: str(formData.get("horario")),
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
  const data = {
    nombre: str(formData.get("nombre")) ?? "Producto",
    descripcion: str(formData.get("descripcion")),
    categoria_id,
    precio: num(formData.get("precio")),
    unidad: str(formData.get("unidad")) ?? "kg",
    imagen_url: str(formData.get("imagen_url")),
    destacado: bool(formData.get("destacado")),
    activo: bool(formData.get("activo")),
  };
  if (id) await prisma.productos.update({ where: { id }, data });
  else await prisma.productos.create({ data });
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
  const validoStr = str(formData.get("valido_hasta"));
  const data = {
    nombre: str(formData.get("nombre")) ?? "Recompensa",
    descripcion: str(formData.get("descripcion")),
    tipo: str(formData.get("tipo")) ?? "descuento",
    puntos_requeridos: Math.round(num(formData.get("puntos_requeridos"))),
    imagen_url: str(formData.get("imagen_url")),
    valido_hasta: validoStr ? new Date(validoStr) : null,
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
  disponible: boolean
) {
  await requireAdmin();
  await prisma.inventario.upsert({
    where: { producto_id_sucursal_id: { producto_id, sucursal_id } },
    update: { stock, disponible },
    create: { producto_id, sucursal_id, stock, disponible },
  });
  revalidatePath("/admin/inventario");
}

/* ---------------- Usuarios (roles) ---------------- */
export async function updateUserRol(id: number, rol: user_role) {
  const admin = await requireAdmin();
  // Only full admins may change roles.
  if (!isAdmin(admin.rol)) throw new Error("No autorizado");
  await prisma.users.update({ where: { id }, data: { rol } });
  revalidatePath("/admin/usuarios");
}

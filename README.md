# CSN — Carnes Selectas Nayarit

Next.js 15 (App Router) + TypeScript + Tailwind + Clerk + Prisma (Neon Postgres) + Resend.
Dominio: **carnesn.ink** · Tema oscuro (surface `#131313`, primary `#ffb77d`, accent `#ff8c00`).

## Stack

- **Next.js 15** App Router (RSC + Server Actions)
- **TypeScript** estricto
- **Tailwind CSS** (tema dark con tokens RGB para opacidad)
- **Clerk** auth (`pk_live` en Vercel) + webhook de sincronización de usuarios
- **Prisma** sobre la base de datos Neon **existente** (no se crean tablas)
- **Resend** para correos transaccionales (bienvenida / pedidos)
- **Lucide** iconos · **Recharts** gráficas del panel admin

## Estructura

```
src/
  middleware.ts            # Clerk: público (/, /catalogo, /sucursales) vs protegido (/app/*, /admin/*)
  lib/                     # prisma, auth (roles), data (queries), resend, format
  app/
    page.tsx               # Landing
    catalogo/  sucursales/  # Públicas (datos de la DB)
    sign-in/  sign-up/      # Clerk
    app/                   # Usuario: dashboard, pedido, recompensas, perfil
    admin/                 # Panel: KPIs, sucursales, productos, pedidos, inventario,
                           #        usuarios, recompensas, reportes (CRUD + gráficas)
    api/
      webhooks/clerk       # svix-verified user sync + email de bienvenida
      webhooks/stripe      # confirma pedido al completar checkout
      productos/  sucursales/  pedidos/   # REST CRUD (escritura protegida por rol staff)
  components/              # PublicHeader, BottomNav, StatusBadge, admin/*
prisma/schema.prisma       # Modela las 11 tablas existentes
```

## Roles (`user_role`)

`admin` · `gerente` · `empleado` · `cliente`. El panel `/admin` exige rol staff
(admin/gerente/empleado); solo `admin`/`gerente` pueden cambiar roles de usuario.
La DB es la fuente de verdad; `publicMetadata.role` de Clerk solo siembra el rol inicial.

## Variables de entorno

Ver [`.env.example`](./.env.example). En Vercel ya están `DATABASE_URL` y las llaves
`pk_live`/`sk_live` de Clerk y `RESEND_API_KEY`. Para webhooks añade
`CLERK_WEBHOOK_SIGNING_SECRET` (apuntando a `/api/webhooks/clerk`).

## Base de datos

La base ya existe en Neon con datos reales (9 sucursales, 8 categorías, 12 productos,
108 inventarios, 5 recompensas). **No** ejecutar `prisma migrate`.

`prisma/schema.prisma` fue escrito a mano según la estructura documentada de las tablas.
Para reconciliar los nombres exactos de columnas con la base en vivo:

```bash
# con DATABASE_URL apuntando a Neon
npm run db:pull      # prisma db pull
npm run db:generate  # prisma generate
```

## Desarrollo

```bash
npm install
cp .env.example .env.local   # rellena los valores
npm run dev
```

## Build

```bash
npm run build   # prisma generate && next build
```

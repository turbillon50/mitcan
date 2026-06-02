# CSN — Decisiones del coordinador

## Decision 1: Database
Ejecutar: npx prisma db pull (usar DATABASE_URL de las env vars de Vercel)
Las tablas YA existen con datos reales: 9 sucursales, 8 categorias, 12 productos, 108 inventarios, 5 recompensas.
NO crear tablas nuevas. Solo sincronizar schema.

## Decision 2: Deploy
Primero arreglar datos (prisma db pull + verificar queries), DESPUES merge PR a main.
No hacer merge hasta que el catalogo cargue datos reales.

## Tablas existentes
sucursales, users, categorias, productos, inventario, pedidos, pedido_items, recompensas, redenciones, notificaciones
Enum: user_role (admin, gerente, empleado, cliente)

## Notas
Todas las env vars ya estan en Vercel (Clerk live, Neon, Resend, etc).
El coordinador (Claude Chat) configuro todo. Solo falta que el schema de Prisma coincida con la DB.

export const dynamic = "force-dynamic";

const BASE = "https://carnesn.ink";

function Code({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-xl border border-hairline bg-surface-2 p-4 text-xs leading-relaxed">
      <code>{children}</code>
    </pre>
  );
}

export default function AdminDocs() {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="section-title text-2xl">API de integración</h1>
        <p className="text-sm text-on-bg-muted">
          Endpoints para conectar tu sistema de inventario con CSN.
        </p>
      </div>

      <section className="card flex flex-col gap-3 p-5">
        <h2 className="font-bold">GET /api/sucursales</h2>
        <p className="text-sm text-on-bg-muted">
          Lista de sucursales con área y coordenadas. Filtro opcional <code>?area=</code>.
        </p>
        <Code>{`curl ${BASE}/api/sucursales
curl "${BASE}/api/sucursales?area=tepic"`}</Code>
      </section>

      <section className="card flex flex-col gap-3 p-5">
        <h2 className="font-bold">GET /api/productos</h2>
        <p className="text-sm text-on-bg-muted">
          Lista de productos con precio base. Con <code>?sucursal=ID</code> aplica el
          precio especial de esa sucursal.
        </p>
        <Code>{`curl ${BASE}/api/productos
curl "${BASE}/api/productos?sucursal=1"`}</Code>
      </section>

      <section className="card flex flex-col gap-3 p-5">
        <h2 className="font-bold">POST /api/sync/inventory</h2>
        <p className="text-sm text-on-bg-muted">
          Actualiza el inventario en lote por <code>sku</code> y <code>sucursal_id</code>.
          Retorna el diff (antes/ahora). Autenticación con el header{" "}
          <code>x-csn-sync-key</code> (variable <code>CSN_SYNC_KEY</code> en Vercel) o
          sesión de staff.
        </p>
        <Code>{`curl -X POST ${BASE}/api/sync/inventory \\
  -H "Content-Type: application/json" \\
  -H "x-csn-sync-key: TU_LLAVE" \\
  -d '[
    { "sku": "CSN-ARRACHERA-MAR", "cantidad": 35, "sucursal_id": 1, "fuente": "sync_externo" },
    { "sku": "CSN-POLLO-FRESCO",  "cantidad": 80, "sucursal_id": 1 }
  ]'`}</Code>
        <p className="text-xs text-on-bg-muted">
          Respuesta: <code>{`{ "procesados": 2, "diff": [{ "sku": "...", "antes": 10, "ahora": 35, "ok": true }] }`}</code>
        </p>
      </section>

      <section className="card flex flex-col gap-2 p-5">
        <h2 className="font-bold">Notas</h2>
        <ul className="list-inside list-disc text-sm text-on-bg-muted">
          <li>El campo <code>fuente</code> distingue <code>manual</code> vs <code>sync_externo</code>.</li>
          <li>Define <code>CSN_SYNC_KEY</code> en Vercel para autenticar el sistema externo.</li>
          <li>Los <code>sku</code> los ves en Admin · Productos.</li>
        </ul>
      </section>
    </div>
  );
}

export default function AdminLoading() {
  return (
    <div className="flex animate-pulse flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="h-7 w-48 rounded-lg bg-surface-2" />
        <div className="h-4 w-72 rounded-lg bg-surface-2" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card h-24 bg-surface-2/60" />
        ))}
      </div>
      <div className="card h-72 bg-surface-2/40" />
      <div className="card h-48 bg-surface-2/40" />
    </div>
  );
}

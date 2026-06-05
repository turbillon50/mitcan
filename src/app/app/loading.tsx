export default function AppLoading() {
  return (
    <div className="flex animate-pulse flex-col gap-5">
      <div className="h-7 w-44 rounded-lg bg-surface-2" />
      <div className="card h-36 bg-surface-2/60" />
      <div className="grid grid-cols-2 gap-3">
        <div className="card h-24 bg-surface-2/40" />
        <div className="card h-24 bg-surface-2/40" />
      </div>
      <div className="card h-56 bg-surface-2/40" />
    </div>
  );
}

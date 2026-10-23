/** Skeleton in the shape of a console page: title row, filter bar, list rows. */
export default function ConsoleLoading() {
  return (
    <div className="grid gap-6" aria-busy="true" aria-label="Loading">
      <div className="grid gap-3 border-b border-line pb-6">
        <div className="h-10 w-56 animate-pulse bg-carbon" />
        <div className="h-4 w-96 max-w-full animate-pulse bg-carbon" />
      </div>
      <div className="h-10 w-full max-w-lg animate-pulse bg-carbon" />
      <div className="grid gap-px">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-14 animate-pulse bg-carbon" style={{ animationDelay: `${i * 80}ms` }} />
        ))}
      </div>
    </div>
  );
}

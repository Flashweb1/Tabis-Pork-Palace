export default function Loading() {
  return (
    <div className="container-x py-10" aria-busy="true" aria-label="Loading">
      <div className="h-10 w-64 animate-pulse rounded bg-forest/10" />
      <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded bg-forest/5" />
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-[4/5] animate-pulse rounded-xl bg-forest/5" />
        ))}
      </div>
    </div>
  );
}

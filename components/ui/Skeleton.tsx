export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-card ${className}`}
      aria-hidden="true"
    />
  );
}

export function MatchCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-card" aria-hidden="true">
      <Skeleton className="h-36 w-full rounded-none" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

export function MatchDetailSkeleton() {
  return (
    <div className="px-4 py-4 sm:px-6 sm:py-6" aria-hidden="true">
      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-[340px]">
          <div className="overflow-hidden rounded-2xl bg-card">
            <Skeleton className="h-48 w-full rounded-none" />
            <div className="space-y-3 p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-3 px-4 pb-4">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
        </aside>
        <main className="min-w-0 flex-1">
          <div className="mb-6 flex gap-6 border-b border-elevated pb-3">
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full" />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

// Decorative placeholders shaped like the content they stand in for. Each view keeps its
// loading text as a visually hidden status message, so these stay hidden from assistive tech.

const CARD_PANEL = 'rounded-card border border-border bg-surface p-4 shadow-soft'

function Bone({ className = '' }) {
  return <div className={`animate-pulse rounded bg-surface-raised motion-reduce:animate-none ${className}`} />
}

function MovieCardSkeleton({ ranked = false }) {
  const offset = ranked ? 'ml-(--rank-offset)' : ''
  return (
    <div className={`flex-none ${offset}`}>
      <Bone className="aspect-2/3 w-(--poster-width) rounded-card" />
      <Bone className="mt-3 h-3.5 w-[85%]" />
      <Bone className="mt-1.5 h-3.5 w-1/2" />
      <Bone className="mt-1.5 h-3 w-10" />
      <div className="flex gap-1.5 pt-3">
        <Bone className="size-8 rounded-md" />
        <Bone className="size-8 rounded-md" />
        <Bone className="size-8 rounded-md" />
      </div>
    </div>
  )
}

function repeat(count, render) {
  return Array.from({ length: count }, (_, index) => render(index))
}

export function MovieRowSkeleton({ ranked = false }) {
  return (
    <div aria-hidden="true" className="-mx-2 flex gap-4 overflow-hidden px-2 pt-2 pb-4">
      {repeat(6, (index) => (
        <MovieCardSkeleton key={index} ranked={ranked} />
      ))}
    </div>
  )
}

export function MovieGridSkeleton({ count = 12 }) {
  return (
    <div
      aria-hidden="true"
      className="grid grid-cols-[repeat(auto-fill,var(--poster-width))] justify-between gap-x-4 gap-y-6 pt-2"
    >
      {repeat(count, (index) => (
        <MovieCardSkeleton key={index} />
      ))}
    </div>
  )
}

export function ListCardsSkeleton() {
  return (
    <div aria-hidden="true" className="grid gap-3 min-[860px]:grid-cols-2">
      {repeat(4, (index) => (
        <div key={index} className={CARD_PANEL}>
          <Bone className="h-5 w-1/2" />
          <Bone className="mt-2 h-4 w-20" />
        </div>
      ))}
    </div>
  )
}

export function ListDetailsSkeleton() {
  return (
    <div aria-hidden="true">
      <Bone className="h-9 w-64 max-w-full" />
      <Bone className="mt-3 h-4 w-20" />
      <div className="mt-4 flex gap-2">
        <Bone className="h-10 w-24 rounded-md" />
        <Bone className="h-10 w-28 rounded-md" />
      </div>
      <Bone className="mt-8 h-7 w-24" />
      <MovieGridSkeleton count={6} />
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="grid gap-3 min-[480px]:grid-cols-2 min-[860px]:grid-cols-4">
        {repeat(4, (index) => (
          <div key={index} className={CARD_PANEL}>
            <Bone className="h-4 w-24" />
            <Bone className="mt-2 h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-6 min-[860px]:grid-cols-2">
        {repeat(2, (index) => (
          <div key={index} className={CARD_PANEL}>
            <Bone className="h-6 w-40" />
            <div className="mt-3 grid gap-2">
              {repeat(5, (row) => (
                <Bone key={row} className="h-4" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function MovieDetailsSkeleton() {
  return (
    <div aria-hidden="true">
      <Bone className="aspect-video max-h-96 w-full rounded-card min-[860px]:aspect-21/9" />
      <div className="flex flex-col gap-6 px-4 min-[860px]:flex-row min-[860px]:px-8">
        <Bone className="-mt-16 aspect-2/3 w-32 flex-none rounded-card border border-border min-[860px]:-mt-24 min-[860px]:w-48" />
        <div className="min-w-0 flex-1 min-[860px]:pt-6">
          <Bone className="h-9 w-72 max-w-full" />
          <Bone className="mt-3 h-4 w-40" />
          <div className="mt-4 flex gap-2">
            {repeat(3, (index) => (
              <Bone key={index} className="h-6 w-16 rounded-full" />
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            {repeat(3, (index) => (
              <Bone key={index} className="h-8 w-28 rounded-md" />
            ))}
          </div>
          <div className="mt-4 grid max-w-3xl gap-2">
            <Bone className="h-4" />
            <Bone className="h-4" />
            <Bone className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    </div>
  )
}

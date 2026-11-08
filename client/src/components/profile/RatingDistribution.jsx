import { useId } from 'react'
import { formatMovieCount } from '../../lib/lists.js'

function starLabel(rating) {
  return rating === 1 ? '1 star' : `${rating} stars`
}

function RatingDistribution({ distribution, ratedCount }) {
  const headingId = useId()
  const largest = Math.max(...distribution.map((bucket) => bucket.count))
  const rows = [...distribution].sort((a, b) => b.rating - a.rating)

  return (
    <section aria-labelledby={headingId} className="rounded-card border border-border bg-surface p-4">
      <h2 id={headingId} className="text-lg font-bold">
        Rating distribution
      </h2>

      {ratedCount === 0 ? (
        <p className="mt-2 text-muted">Rate movies you&apos;ve watched to see your rating distribution.</p>
      ) : (
        <ul className="mt-3 grid list-none gap-2">
          {rows.map(({ rating, count }) => (
            <li key={rating} className="grid grid-cols-[4rem_1fr_5rem] items-center gap-3 text-sm">
              <span className="text-star-on">{starLabel(rating)}</span>
              <span aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-surface-raised">
                <span
                  className="block h-full rounded-full bg-star-on"
                  style={{ width: `${largest === 0 ? 0 : (count / largest) * 100}%` }}
                />
              </span>
              <span className="text-right text-muted">{formatMovieCount(count)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default RatingDistribution

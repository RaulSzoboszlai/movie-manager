import { useId } from 'react'
import { formatMovieCount } from '../../lib/lists.js'

function TopGenres({ genres }) {
  const headingId = useId()

  return (
    <section aria-labelledby={headingId} className="rounded-card border border-border bg-surface p-4">
      <h2 id={headingId} className="text-lg font-bold">
        Top genres
      </h2>

      {genres.length === 0 ? (
        <p className="mt-2 text-muted">Save some movies to see your top genres.</p>
      ) : (
        <ol className="mt-3 grid list-none gap-2">
          {genres.map((genre, index) => (
            <li key={genre.id} className="flex items-baseline gap-3">
              <span aria-hidden="true" className="w-5 font-bold text-accent">
                {index + 1}
              </span>
              <span className="font-medium break-words">{genre.name}</span>
              <span className="text-sm text-muted">· {formatMovieCount(genre.count)}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

export default TopGenres

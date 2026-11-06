import { useId } from 'react'
import useLibrary from '../../hooks/useLibrary.js'
import useLibraryAction from '../../hooks/useLibraryAction.js'

const STARS = [1, 2, 3, 4, 5]

function StarRating({ movie }) {
  const { movies, update } = useLibrary()
  const { pending, failed, run, ignoreKeyRepeat } = useLibraryAction()
  const hintId = useId()

  const { tmdbId, title } = movie
  const saved = movies.find((savedMovie) => savedMovie.tmdbId === tmdbId)
  const watched = saved?.status === 'watched'
  const rating = watched ? saved.rating : null

  const summary = rating === null ? 'not rated' : `${rating} out of 5 stars`

  return (
    <div>
      <div
        role="group"
        aria-label={`Your rating for ${title}: ${summary}`}
        aria-busy={pending}
        aria-describedby={watched ? undefined : hintId}
        className="flex"
      >
        {STARS.map((star) => {
          const current = star === rating
          const label = current ? 'Clear rating' : `Rate ${star} out of 5`

          return (
            <button
              key={star}
              type="button"
              disabled={!watched}
              onClick={(event) => run(event, () => update(tmdbId, { rating: current ? null : star }))}
              onKeyDown={ignoreKeyRepeat}
              aria-label={label}
              title={current ? label : undefined}
              aria-pressed={current}
              aria-disabled={pending || undefined}
              className={`size-6 flex-none rounded-sm text-base leading-none transition-colors focus-visible:outline-2 focus-visible:outline-accent motion-reduce:transition-none ${rating !== null && star <= rating ? 'text-star-on' : 'text-star-off'} ${!watched || pending ? 'cursor-default' : 'hover:text-star-on'} ${pending ? 'opacity-60' : ''}`}
            >
              <span aria-hidden="true">★</span>
            </button>
          )
        })}
      </div>
      {!watched && (
        <p id={hintId} className="mt-1 text-xs text-muted">
          Rate this movie once you&apos;ve watched it.
        </p>
      )}
      {failed && (
        <p role="alert" className="mt-1 text-xs text-error">
          Couldn&apos;t update. Try again.
        </p>
      )}
    </div>
  )
}

export default StarRating

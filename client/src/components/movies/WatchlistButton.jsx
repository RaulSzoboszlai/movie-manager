import useLibrary from '../../hooks/useLibrary.js'
import useLibraryAction, { BUTTON_BASE_CLASS, BUTTON_IDLE_CLASS } from '../../hooks/useLibraryAction.js'

const SAVED_CLASS = 'border-accent bg-accent-soft text-accent hover:border-accent-hover hover:text-accent-hover'
const INACTIVE_CLASS = 'cursor-default border-border text-muted'

function WatchlistButton({ movie }) {
  const { status, movies, retry, add, remove } = useLibrary()
  const { pending, failed, run, ignoreKeyRepeat } = useLibraryAction()

  const { tmdbId, title } = movie
  const saved = movies.some((savedMovie) => savedMovie.tmdbId === tmdbId)

  if (status === 'error') {
    return (
      <button type="button" onClick={retry} aria-label="Retry loading watchlist" className={`${BUTTON_BASE_CLASS} ${BUTTON_IDLE_CLASS}`}>
        Retry
      </button>
    )
  }

  if (status === 'loading') {
    return (
      <button type="button" aria-disabled="true" aria-label={`Watchlist: ${title}`} className={`${BUTTON_BASE_CLASS} ${INACTIVE_CLASS}`}>
        Watchlist
      </button>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={(event) => run(event, () => (saved ? remove(tmdbId) : add(movie)))}
        onKeyDown={ignoreKeyRepeat}
        aria-label={`Watchlist: ${title}`}
        aria-pressed={saved}
        aria-busy={pending}
        aria-disabled={pending}
        className={`${BUTTON_BASE_CLASS} ${saved ? SAVED_CLASS : BUTTON_IDLE_CLASS} ${pending ? 'cursor-default opacity-60' : ''}`}
      >
        <span aria-hidden="true">{saved ? '✓' : '+'}</span> Watchlist
      </button>
      {failed && (
        <p role="alert" className="mt-1 text-xs text-error">
          Couldn&apos;t update. Try again.
        </p>
      )}
    </>
  )
}

export default WatchlistButton

import useLibrary from '../../hooks/useLibrary.js'
import useToast from '../../hooks/useToast.js'
import useLibraryAction, { ACTION_ERROR_CLASS, BUTTON_IDLE_CLASS, actionButtonClass } from '../../hooks/useLibraryAction.js'
import { ActionLabel, BookmarkIcon, RetryIcon } from './ActionIcons.jsx'

const SAVED_CLASS = 'border-accent bg-accent-soft text-accent hover:border-accent-hover hover:text-accent-hover'
const INACTIVE_CLASS = 'cursor-default border-border text-muted'

function WatchlistButton({ movie, compact = false }) {
  const { status, movies, retry, add, remove } = useLibrary()
  const { pending, failed, run, ignoreKeyRepeat } = useLibraryAction()
  const showToast = useToast()

  const { tmdbId, title } = movie
  const saved = movies.some((savedMovie) => savedMovie.tmdbId === tmdbId)
  const buttonClass = actionButtonClass(compact)

  async function toggle() {
    if (saved) {
      await remove(tmdbId)
      showToast(`Removed “${title}” from your watchlist`)
    } else {
      await add(movie)
      showToast(`Added “${title}” to your watchlist`)
    }
  }

  if (status === 'error') {
    return (
      <button
        type="button"
        onClick={retry}
        aria-label="Retry loading watchlist"
        className={`${buttonClass} ${BUTTON_IDLE_CLASS}`}
      >
        <RetryIcon />
        <ActionLabel compact={compact}>Retry</ActionLabel>
      </button>
    )
  }

  if (status === 'loading') {
    return (
      <button type="button" aria-disabled="true" aria-label={`Watchlist: ${title}`} className={`${buttonClass} ${INACTIVE_CLASS}`}>
        <BookmarkIcon />
        <ActionLabel compact={compact}>Watchlist</ActionLabel>
      </button>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={(event) => run(event, toggle)}
        onKeyDown={ignoreKeyRepeat}
        aria-label={`Watchlist: ${title}`}
        aria-pressed={saved}
        aria-busy={pending}
        aria-disabled={pending}
        className={`${buttonClass} ${saved ? SAVED_CLASS : BUTTON_IDLE_CLASS} ${pending ? 'cursor-default opacity-60' : ''}`}
      >
        <BookmarkIcon filled={saved} />
        <ActionLabel compact={compact}>Watchlist</ActionLabel>
      </button>
      {failed && (
        <p role="alert" className={ACTION_ERROR_CLASS}>
          Couldn&apos;t update. Try again.
        </p>
      )}
    </>
  )
}

export default WatchlistButton

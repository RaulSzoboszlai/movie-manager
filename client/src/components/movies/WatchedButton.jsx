import useLibrary from '../../hooks/useLibrary.js'
import useLibraryAction, { ACTION_ERROR_CLASS, BUTTON_IDLE_CLASS, actionButtonClass } from '../../hooks/useLibraryAction.js'
import { ActionLabel, WatchedIcon } from './ActionIcons.jsx'

const WATCHED_CLASS = 'border-watched bg-watched-soft text-watched'

function WatchedButton({ movie, compact = false }) {
  const { movies, add, update } = useLibrary()
  const { pending, failed, run, ignoreKeyRepeat } = useLibraryAction()

  const { tmdbId, title } = movie
  const saved = movies.find((savedMovie) => savedMovie.tmdbId === tmdbId)
  const watched = saved?.status === 'watched'

  function moveBack() {
    const rating = saved.rating
    if (
      rating !== null &&
      !window.confirm(`Move "${title}" back to Want to watch? This clears your ${rating}-star rating.`)
    ) {
      return undefined
    }
    return update(tmdbId, { status: 'want' })
  }

  function toggle() {
    if (watched) return moveBack()
    return saved ? update(tmdbId, { status: 'watched' }) : add(movie, 'watched')
  }

  return (
    <>
      <button
        type="button"
        onClick={(event) => run(event, toggle)}
        onKeyDown={ignoreKeyRepeat}
        aria-label={`Watched: ${title}`}
        aria-pressed={watched}
        aria-busy={pending}
        aria-disabled={pending}
        className={`${actionButtonClass(compact)} ${watched ? WATCHED_CLASS : BUTTON_IDLE_CLASS} ${pending ? 'cursor-default opacity-60' : ''}`}
      >
        <WatchedIcon filled={watched} />
        <ActionLabel compact={compact}>Watched</ActionLabel>
      </button>
      {failed && (
        <p role="alert" className={ACTION_ERROR_CLASS}>
          Couldn&apos;t update. Try again.
        </p>
      )}
    </>
  )
}

export default WatchedButton

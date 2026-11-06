import { useEffect, useId, useRef } from 'react'
import { Link } from 'react-router-dom'
import MovieGrid from '../components/movies/MovieGrid.jsx'
import useLibrary from '../hooks/useLibrary.js'

function LibraryPage() {
  const { status, movies, retry } = useLibrary()
  const tabId = useId()
  const panelId = useId()
  const panelRef = useRef(null)

  const wanted = movies.filter((movie) => movie.status === 'want')
  const wantedCount = wanted.length
  const wantedIds = wanted.map((movie) => movie.tmdbId)
  const previousIds = useRef(wantedIds)

  // A removed card takes the focused button with it, which would drop keyboard users
  // back to the top of the page. The next card takes over its place in the list.
  useEffect(() => {
    const previous = previousIds.current
    previousIds.current = wantedIds
    if (wantedIds.length >= previous.length || document.activeElement !== document.body) return

    const removedIndex = previous.findIndex((id) => !wantedIds.includes(id))
    const buttons = panelRef.current.querySelectorAll('article button')
    const neighbour = buttons[Math.min(removedIndex, buttons.length - 1)]
    ;(neighbour ?? panelRef.current).focus()
  })

  // The retry removes this button, so focus moves first to a place that stays.
  function handleRetry() {
    panelRef.current.focus()
    retry()
  }

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight min-[860px]:text-4xl">My library</h1>

      <div role="tablist" aria-label="Library" className="mt-6 flex gap-4 border-b border-border">
        <button
          type="button"
          role="tab"
          id={tabId}
          aria-selected="true"
          aria-controls={panelId}
          className="-mb-px border-b-2 border-accent px-1 pb-2 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Want to watch
        </button>
      </div>

      <div ref={panelRef} role="tabpanel" id={panelId} aria-labelledby={tabId} tabIndex={-1} className="mt-6 outline-none">
        {status === 'loading' && (
          <p role="status" className="text-muted">
            Loading your watchlist...
          </p>
        )}

        {status === 'error' && (
          <div role="alert">
            <p className="text-error">We couldn&apos;t load your watchlist.</p>
            <button
              type="button"
              onClick={handleRetry}
              className="mt-4 rounded-md bg-accent px-4 py-2 font-medium text-accent-ink transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none"
            >
              Try again
            </button>
          </div>
        )}

        {status === 'ready' && wantedCount === 0 && (
          <p className="text-muted">
            Nothing on your watchlist yet.{' '}
            <Link to="/search" className="text-accent underline underline-offset-2 hover:text-accent-hover">
              Find a movie
            </Link>
          </p>
        )}

        {status === 'ready' && wantedCount > 0 && <MovieGrid movies={wanted} labelledBy={tabId} />}
      </div>
    </>
  )
}

export default LibraryPage

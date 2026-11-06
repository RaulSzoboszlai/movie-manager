import { useEffect, useId, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import MovieGrid from '../components/movies/MovieGrid.jsx'
import useLibrary from '../hooks/useLibrary.js'

const TABS = [
  { key: 'want', label: 'Want to watch' },
  { key: 'watched', label: 'Watched' },
]

function getNextTabIndex(key, index) {
  if (key === 'ArrowRight') return (index + 1) % TABS.length
  if (key === 'ArrowLeft') return (index - 1 + TABS.length) % TABS.length
  if (key === 'Home') return 0
  if (key === 'End') return TABS.length - 1
  return null
}

function LibraryPage() {
  const { status, movies, retry } = useLibrary()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabIds = { want: useId(), watched: useId() }
  const panelId = useId()
  const panelRef = useRef(null)

  const selected = searchParams.get('tab') === 'watched' ? 'watched' : 'want'
  const list =
    selected === 'watched'
      ? movies
          .filter((movie) => movie.status === 'watched')
          .sort((a, b) => new Date(b.watchedAt) - new Date(a.watchedAt))
      : movies.filter((movie) => movie.status === 'want')
  const listIds = list.map((movie) => movie.tmdbId)
  const previousList = useRef({ tab: selected, ids: listIds })

  // A card leaving the list takes the focused button with it, which would drop keyboard
  // users back to the top of the page. The next card takes over its place in the list.
  // A tab switch to a shorter list is not a removal, whatever the browser did with focus.
  useEffect(() => {
    const previous = previousList.current
    previousList.current = { tab: selected, ids: listIds }
    if (
      previous.tab !== selected ||
      listIds.length >= previous.ids.length ||
      document.activeElement !== document.body
    ) {
      return
    }

    const removedIndex = previous.ids.findIndex((id) => !listIds.includes(id))
    const cards = panelRef.current.querySelectorAll('article')
    const neighbour = cards[Math.min(removedIndex, cards.length - 1)]?.querySelector('button')
    ;(neighbour ?? panelRef.current).focus()
  })

  function selectTab(key) {
    setSearchParams(key === 'watched' ? { tab: 'watched' } : {}, { replace: true })
  }

  function handleTabKeyDown(event, index) {
    const nextIndex = getNextTabIndex(event.key, index)
    if (nextIndex === null) return

    event.preventDefault()
    const { key } = TABS[nextIndex]
    document.getElementById(tabIds[key]).focus()
    selectTab(key)
  }

  // The retry removes this button, so focus moves first to a place that stays.
  function handleRetry() {
    panelRef.current.focus()
    retry()
  }

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight min-[860px]:text-4xl">My library</h1>

      <div role="tablist" aria-label="Library" className="mt-6 flex gap-4 border-b border-border">
        {TABS.map(({ key, label }, index) => (
          <button
            key={key}
            type="button"
            role="tab"
            id={tabIds[key]}
            aria-selected={key === selected}
            aria-controls={panelId}
            tabIndex={key === selected ? 0 : -1}
            onClick={() => selectTab(key)}
            onKeyDown={(event) => handleTabKeyDown(event, index)}
            className={`-mb-px border-b-2 px-1 pb-2 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none ${key === selected ? 'border-accent' : 'border-transparent text-muted hover:text-text'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div
        ref={panelRef}
        role="tabpanel"
        id={panelId}
        aria-labelledby={tabIds[selected]}
        tabIndex={-1}
        className="mt-6 outline-none"
      >
        {status === 'loading' && (
          <p role="status" className="text-muted">
            Loading your library...
          </p>
        )}

        {status === 'error' && (
          <div role="alert">
            <p className="text-error">We couldn&apos;t load your library.</p>
            <button
              type="button"
              onClick={handleRetry}
              className="mt-4 rounded-md bg-accent px-4 py-2 font-medium text-accent-ink transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none"
            >
              Try again
            </button>
          </div>
        )}

        {status === 'ready' && list.length === 0 && (
          <p className="text-muted">
            {selected === 'watched' ? 'Nothing watched yet.' : 'Nothing on your watchlist yet.'}{' '}
            <Link to="/search" className="text-accent underline underline-offset-2 hover:text-accent-hover">
              Find a movie
            </Link>
          </p>
        )}

        {status === 'ready' && list.length > 0 && <MovieGrid movies={list} labelledBy={tabIds[selected]} />}
      </div>
    </>
  )
}

export default LibraryPage

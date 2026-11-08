import { useEffect, useId, useRef } from 'react'
import useMovieSearch from '../../hooks/useMovieSearch.js'
import EmptyState from '../feedback/EmptyState.jsx'
import { MovieGridSkeleton } from '../feedback/Skeletons.jsx'
import MovieGrid from './MovieGrid.jsx'

const BUTTON_CLASS =
  'rounded-md bg-accent px-4 py-2 font-medium text-accent-ink transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent aria-disabled:cursor-not-allowed aria-disabled:opacity-60 motion-reduce:transition-none'

function emptyMessage(query, hasFilters) {
  if (!query) return 'No movies match these filters.'
  return hasFilters ? `No movies found for "${query}" with these filters.` : `No movies found for "${query}".`
}

function SearchResults({ query, genre, year }) {
  const headingId = useId()
  const gridRef = useRef(null)
  const emptyRef = useRef(null)
  const { status, movies, focusCard, hasMore, noNewMatches, loadMoreStatus, retry, loadMore } = useMovieSearch({
    query,
    genre,
    year,
  })
  const isLoadingMore = loadMoreStatus === 'loading'

  // The Load more button can disappear on the last page, which would drop focus.
  useEffect(() => {
    if (focusCard === null) return
    const target = emptyRef.current ?? gridRef.current?.children[focusCard.index]?.querySelector('a')
    target?.focus()
  }, [focusCard])

  if (status === 'loading') {
    return (
      <>
        <p role="status" className="sr-only">
          Searching for movies...
        </p>
        <MovieGridSkeleton />
      </>
    )
  }

  if (status === 'error') {
    return (
      <div role="alert">
        <p className="text-error">We couldn&apos;t search for movies.</p>
        <button type="button" onClick={retry} className={`mt-4 ${BUTTON_CLASS}`}>
          Try again
        </button>
      </div>
    )
  }

  if (movies.length === 0 && !hasMore) {
    return (
      <EmptyState
        ref={emptyRef}
        role="status"
        tabIndex={-1}
        icon="search"
        title={emptyMessage(query, Boolean(genre || year))}
        message="Try a different title or change the filters."
      />
    )
  }

  const showNoNewMatches = noNewMatches && !isLoadingMore

  return (
    <section>
      <h2 id={headingId} className="mb-4 text-xl font-bold tracking-tight wrap-anywhere min-[860px]:text-2xl">
        {query ? `Results for "${query}"` : 'Filtered movies'}
      </h2>

      {movies.length > 0 && <MovieGrid ref={gridRef} movies={movies} labelledBy={headingId} />}

      <p role="status" className={showNoNewMatches ? 'mt-6 text-center text-muted' : 'sr-only'}>
        {isLoadingMore && 'Loading more movies...'}
        {showNoNewMatches && 'No new matches yet. Load more to keep looking.'}
      </p>

      {loadMoreStatus === 'error' && (
        <p role="alert" className="mt-6 text-center text-error">
          We couldn&apos;t load more movies.
        </p>
      )}

      {hasMore && (
        <div className="mt-6 flex justify-center">
          <button type="button" onClick={loadMore} aria-disabled={isLoadingMore} className={BUTTON_CLASS}>
            {isLoadingMore ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}
    </section>
  )
}

export default SearchResults

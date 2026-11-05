import { useEffect, useId, useRef } from 'react'
import useMovieSearch from '../../hooks/useMovieSearch.js'
import MovieGrid from './MovieGrid.jsx'

const BUTTON_CLASS =
  'rounded-md bg-accent px-4 py-2 font-medium text-accent-ink transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent aria-disabled:cursor-not-allowed aria-disabled:opacity-60 motion-reduce:transition-none'

function SearchResults({ query }) {
  const headingId = useId()
  const gridRef = useRef(null)
  const { status, movies, focusCard, hasMore, loadMoreStatus, retry, loadMore } = useMovieSearch(query)
  const isLoadingMore = loadMoreStatus === 'loading'

  // The Load more button can disappear on the last page, which would drop focus.
  useEffect(() => {
    if (focusCard === null) return
    gridRef.current?.children[focusCard.index]?.querySelector('a')?.focus()
  }, [focusCard])

  if (status === 'loading') {
    return (
      <p role="status" className="text-muted">
        Searching for movies...
      </p>
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

  if (movies.length === 0) {
    return (
      <p role="status" className="text-muted wrap-anywhere">
        No movies found for &quot;{query}&quot;.
      </p>
    )
  }

  return (
    <section>
      <h2 id={headingId} className="mb-4 text-xl font-bold tracking-tight wrap-anywhere min-[860px]:text-2xl">
        Results for &quot;{query}&quot;
      </h2>

      <MovieGrid ref={gridRef} movies={movies} labelledBy={headingId} />

      <p role="status" className="sr-only">
        {isLoadingMore ? 'Loading more movies...' : ''}
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

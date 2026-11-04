import TopTenRow from '../components/movies/TopTenRow.jsx'
import useTrendingMovies from '../hooks/useTrendingMovies.js'

const HEADING_ID = 'top-ten-heading'

function HomePage() {
  const { status, movies, retry } = useTrendingMovies()

  return (
    <div className="flex flex-1 flex-col justify-center">
      <h1 id={HEADING_ID} className="text-3xl font-bold tracking-tight min-[860px]:text-4xl">
        Top 10 trending
      </h1>
      <p className="mt-1 mb-6 text-muted">What people are watching this week.</p>

      {status === 'loading' && (
        <p role="status" className="text-muted">
          Loading trending movies...
        </p>
      )}

      {status === 'error' && (
        <div role="alert">
          <p className="text-error">We couldn&apos;t load trending movies.</p>
          <button
            type="button"
            onClick={retry}
            className="mt-4 rounded-md bg-accent px-4 py-2 font-medium text-accent-ink transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none"
          >
            Try again
          </button>
        </div>
      )}

      {status === 'ready' && movies.length === 0 && <p className="text-muted">No trending movies right now.</p>}

      {status === 'ready' && movies.length > 0 && <TopTenRow movies={movies} labelledBy={HEADING_ID} />}
    </div>
  )
}

export default HomePage

import { useId } from 'react'
import useMovieList from '../../hooks/useMovieList.js'
import MovieRow from './MovieRow.jsx'

function MovieSection({ path, heading, noun, subheading, ranked = false }) {
  const headingId = useId()
  const { status, movies, retry } = useMovieList(path)

  return (
    <section>
      <header className={subheading ? 'mb-6' : 'mb-4'}>
        <h2
          id={headingId}
          className={`font-bold tracking-tight ${ranked ? 'text-gradient text-3xl min-[860px]:text-4xl' : 'text-xl min-[860px]:text-2xl'}`}
        >
          {heading}
        </h2>
        {subheading && <p className="mt-1 text-muted">{subheading}</p>}
      </header>

      {status === 'loading' && (
        <p role="status" className="text-muted">
          Loading {noun} movies...
        </p>
      )}

      {status === 'error' && (
        <div role="alert">
          <p className="text-error">We couldn&apos;t load {noun} movies.</p>
          <button
            type="button"
            onClick={retry}
            className="mt-4 rounded-md bg-accent px-4 py-2 font-medium text-accent-ink transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none"
          >
            Try again
          </button>
        </div>
      )}

      {status === 'ready' && movies.length === 0 && <p className="text-muted">No {noun} movies right now.</p>}

      {status === 'ready' && movies.length > 0 && <MovieRow movies={movies} labelledBy={headingId} ranked={ranked} />}
    </section>
  )
}

export default MovieSection

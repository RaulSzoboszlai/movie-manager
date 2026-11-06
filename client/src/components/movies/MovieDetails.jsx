import { Link } from 'react-router-dom'
import useMovieDetails from '../../hooks/useMovieDetails.js'
import CastRow from './CastRow.jsx'
import MovieHero from './MovieHero.jsx'
import MovieSection from './MovieSection.jsx'
import TrailerEmbed from './TrailerEmbed.jsx'

function MovieDetails({ tmdbId }) {
  const { status, movie, retry } = useMovieDetails(tmdbId)

  if (status === 'loading') {
    return (
      <p role="status" className="text-muted">
        Loading movie...
      </p>
    )
  }

  if (status === 'notFound') {
    return (
      <>
        <h1 className="text-3xl font-bold tracking-tight min-[860px]:text-4xl">Movie not found</h1>
        <p className="mt-1 text-muted">
          We couldn&apos;t find this movie.{' '}
          <Link to="/" className="text-accent underline underline-offset-2 hover:text-accent-hover">
            Go back home
          </Link>
        </p>
      </>
    )
  }

  if (status === 'error') {
    return (
      <div role="alert">
        <p className="text-error">We couldn&apos;t load this movie.</p>
        <button
          type="button"
          onClick={retry}
          className="mt-4 rounded-md bg-accent px-4 py-2 font-medium text-accent-ink transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-10">
      <MovieHero movie={movie} />
      <CastRow cast={movie.cast} />
      {movie.trailerKey && <TrailerEmbed trailerKey={movie.trailerKey} title={movie.title} />}
      <MovieSection path={`/movies/${movie.tmdbId}/similar`} heading="You might also like" noun="similar" />
    </div>
  )
}

export default MovieDetails

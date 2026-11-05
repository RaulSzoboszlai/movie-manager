import MovieCard from './MovieCard.jsx'

function MovieGrid({ movies, labelledBy, ref }) {
  return (
    <ul
      ref={ref}
      aria-labelledby={labelledBy}
      className="grid list-none grid-cols-[repeat(auto-fill,var(--poster-width))] justify-between gap-x-4 gap-y-6 pt-2"
    >
      {movies.map((movie) => (
        <li key={movie.tmdbId}>
          <MovieCard movie={movie} />
        </li>
      ))}
    </ul>
  )
}

export default MovieGrid

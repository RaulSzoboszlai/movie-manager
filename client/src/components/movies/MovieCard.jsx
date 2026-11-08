import { Link } from 'react-router-dom'
import LibraryControls from './LibraryControls.jsx'

const POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w342'

function getOffsetClass(rank) {
  if (rank === undefined) return '[--offset:0px]'
  return rank >= 10 ? '[--offset:var(--rank-offset-wide)]' : '[--offset:var(--rank-offset)]'
}

function MovieCard({ movie, rank, controls }) {
  const { tmdbId, title, posterPath, releaseYear } = movie

  return (
    <article className={`flex h-full w-[calc(var(--offset)+var(--poster-width))] flex-col ${getOffsetClass(rank)}`}>
      <Link to={`/movie/${tmdbId}`} className="group block outline-none">
        <div className="relative isolate">
          {rank !== undefined && (
            <span className="absolute bottom-0 left-0 z-0 text-(length:--rank-size) leading-[0.8] font-black tracking-[-0.06em] text-bg transition-[-webkit-text-stroke-color] duration-150 [-webkit-text-stroke:2px_var(--color-muted)] group-hover:[-webkit-text-stroke-color:var(--color-accent)] motion-reduce:transition-none">
              {rank}
            </span>
          )}
          <div className="relative z-10 ml-(--offset) aspect-2/3 overflow-hidden rounded-card border border-border bg-surface-raised transition duration-150 group-hover:-translate-y-1 group-hover:border-border-strong group-hover:shadow-lift group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-accent motion-reduce:transition-none motion-reduce:group-hover:translate-y-0">
            {posterPath ? (
              <img
                src={`${POSTER_BASE_URL}${posterPath}`}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
            ) : (
              <span
                aria-hidden="true"
                className="flex h-full items-end p-2 text-xs leading-tight font-bold wrap-anywhere sm:p-3 sm:text-sm"
              >
                {title}
              </span>
            )}
          </div>
        </div>
        <h3 className="mt-3 ml-(--offset) text-sm leading-tight font-medium wrap-anywhere">{title}</h3>
      </Link>
      {typeof releaseYear === 'number' && <p className="mt-1 ml-(--offset) text-xs text-muted">{releaseYear}</p>}
      <div className="mt-auto ml-(--offset) pt-3">
        {controls ?? <LibraryControls movie={movie} />}
      </div>
    </article>
  )
}

export default MovieCard

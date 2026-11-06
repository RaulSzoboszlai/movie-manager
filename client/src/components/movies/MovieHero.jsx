import { formatReleaseDate, formatRuntime } from '../../lib/movieFormat.js'
import WatchlistButton from './WatchlistButton.jsx'

const BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/w1280'
const POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w500'

function MovieHero({ movie }) {
  const { tmdbId, title, overview, posterPath, backdropPath, releaseDate, runtime, genres } = movie
  const facts = [releaseDate && formatReleaseDate(releaseDate), runtime && formatRuntime(runtime)].filter(Boolean)
  const snapshot = {
    tmdbId,
    title,
    posterPath,
    releaseYear: releaseDate ? Number(releaseDate.slice(0, 4)) : null,
    genreIds: genres.map((genre) => genre.id),
  }

  return (
    <section>
      {backdropPath && (
        <div className="relative aspect-video max-h-96 w-full overflow-hidden rounded-card min-[860px]:aspect-21/9">
          <img src={`${BACKDROP_BASE_URL}${backdropPath}`} alt="" className="h-full w-full object-cover" />
          <div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-bg to-transparent" />
        </div>
      )}

      <div className={`flex flex-col gap-6 min-[860px]:flex-row ${backdropPath ? 'px-4 min-[860px]:px-8' : ''}`}>
        <div
          className={`relative aspect-2/3 w-32 flex-none self-start overflow-hidden rounded-card border border-border bg-surface-raised min-[860px]:w-48 ${backdropPath ? '-mt-16 min-[860px]:-mt-24' : ''}`}
        >
          {posterPath ? (
            <img src={`${POSTER_BASE_URL}${posterPath}`} alt="" className="h-full w-full object-cover" />
          ) : (
            <span aria-hidden="true" className="flex h-full items-end p-3 text-sm leading-tight font-bold wrap-anywhere">
              {title}
            </span>
          )}
        </div>

        <div className={`min-w-0 ${backdropPath ? 'min-[860px]:pt-6' : ''}`}>
          <h1 className="text-3xl font-bold tracking-tight wrap-anywhere min-[860px]:text-4xl">{title}</h1>

          {facts.length > 0 && <p className="mt-2 text-muted">{facts.join(' · ')}</p>}

          {genres.length > 0 && (
            <ul className="mt-4 flex list-none flex-wrap gap-2">
              {genres.map((genre) => (
                <li
                  key={genre.id}
                  className="rounded-full border border-border bg-surface-raised px-3 py-1 text-xs font-medium"
                >
                  {genre.name}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 w-40">
            <WatchlistButton movie={snapshot} />
          </div>

          <p className={`mt-4 max-w-3xl leading-relaxed wrap-anywhere ${overview ? '' : 'text-muted'}`}>
            {overview || 'No overview available.'}
          </p>
        </div>
      </div>
    </section>
  )
}

export default MovieHero

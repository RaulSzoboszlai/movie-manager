import { useId } from 'react'

const PROFILE_BASE_URL = 'https://image.tmdb.org/t/p/w185'

function CastRow({ cast }) {
  const headingId = useId()

  return (
    <section>
      <h2 id={headingId} className="mb-4 text-xl font-bold tracking-tight min-[860px]:text-2xl">
        Cast
      </h2>

      {cast.length === 0 ? (
        <p className="text-muted">No cast information available.</p>
      ) : (
        // The cards hold nothing focusable, so the row needs its own tab stop to scroll by keyboard.
        <ul
          aria-labelledby={headingId}
          tabIndex={0}
          className="-mx-2 flex list-none scroll-px-2 gap-4 overflow-x-auto rounded-card px-2 pt-2 pb-4 [scrollbar-width:none] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [&::-webkit-scrollbar]:hidden"
        >
          {cast.map(({ id, name, character, profilePath }) => (
            <li key={id} className="w-28 flex-none sm:w-32">
              <div className="aspect-2/3 overflow-hidden rounded-card border border-border bg-surface-raised">
                {profilePath && (
                  <img
                    src={`${PROFILE_BASE_URL}${profilePath}`}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <p className="mt-3 text-sm leading-tight font-medium wrap-anywhere">{name}</p>
              {character && <p className="mt-1 text-xs text-muted wrap-anywhere">{character}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default CastRow

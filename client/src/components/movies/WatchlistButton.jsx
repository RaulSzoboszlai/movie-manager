import { useState } from 'react'
import useLibrary from '../../hooks/useLibrary.js'

const BASE_CLASS =
  'w-full rounded-md border px-2 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none'
const IDLE_CLASS = 'border-border-strong hover:border-accent hover:text-accent'
const SAVED_CLASS = 'border-accent bg-accent-soft text-accent hover:border-accent-hover hover:text-accent-hover'
const INACTIVE_CLASS = 'cursor-default border-border text-muted'

function WatchlistButton({ movie }) {
  const { status, movies, retry, add, remove } = useLibrary()
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)

  const { tmdbId, title } = movie
  const saved = movies.some((savedMovie) => savedMovie.tmdbId === tmdbId)

  if (status === 'error') {
    return (
      <button type="button" onClick={retry} aria-label="Retry loading watchlist" className={`${BASE_CLASS} ${IDLE_CLASS}`}>
        Retry
      </button>
    )
  }

  if (status === 'loading') {
    return (
      <button type="button" aria-disabled="true" aria-label={`Watchlist: ${title}`} className={`${BASE_CLASS} ${INACTIVE_CLASS}`}>
        Watchlist
      </button>
    )
  }

  // On the library page the next card's button takes this one's place, under both the
  // pointer and the focus, so a double click or a held key would remove several movies.
  function ignoreKeyRepeat(event) {
    if (event.repeat && event.key === 'Enter') event.preventDefault()
  }

  async function handleClick(event) {
    if (pending || event.detail > 1) return

    setPending(true)
    setFailed(false)
    try {
      await (saved ? remove(tmdbId) : add(movie))
    } catch {
      setFailed(true)
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        onKeyDown={ignoreKeyRepeat}
        aria-label={`Watchlist: ${title}`}
        aria-pressed={saved}
        aria-busy={pending}
        aria-disabled={pending}
        className={`${BASE_CLASS} ${saved ? SAVED_CLASS : IDLE_CLASS} ${pending ? 'cursor-default opacity-60' : ''}`}
      >
        <span aria-hidden="true">{saved ? '✓' : '+'}</span> Watchlist
      </button>
      {failed && (
        <p role="alert" className="mt-1 text-xs text-error">
          Couldn&apos;t update. Try again.
        </p>
      )}
    </>
  )
}

export default WatchlistButton

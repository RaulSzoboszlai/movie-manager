import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import FormField from '../components/auth/FormField.jsx'
import FilterSelect from '../components/movies/FilterSelect.jsx'
import SearchResults from '../components/movies/SearchResults.jsx'
import useGenres from '../hooks/useGenres.js'

const DEBOUNCE_MS = 300
const GENRE_PATTERN = /^[1-9]\d{0,8}$/
const YEAR_PATTERN = /^(19|20)\d{2}$/
const OLDEST_YEAR = 1900

const newestYear = new Date().getFullYear() + 1
const YEAR_OPTIONS = [
  { value: '', label: 'Any year' },
  ...Array.from({ length: newestYear - OLDEST_YEAR + 1 }, (_, index) => {
    const year = String(newestYear - index)
    return { value: year, label: year }
  }),
]

// Keeps a filter from the URL visible, so the menu never claims "All" while it applies.
function withCurrentValue(options, value, label) {
  if (!value || options.some((option) => option.value === value)) return options
  return [options[0], { value, label }, ...options.slice(1)]
}

function readFilter(searchParams, name, pattern) {
  const value = searchParams.get(name) ?? ''
  return pattern.test(value) ? value : ''
}

function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = (searchParams.get('q') ?? '').trim()
  const genre = readFilter(searchParams, 'genre', GENRE_PATTERN)
  const year = readFilter(searchParams, 'year', YEAR_PATTERN)
  const [input, setInput] = useState(query)
  const latestQuery = useRef(query)
  const genreList = useGenres()

  function writeUrl({ q, genre, year }) {
    latestQuery.current = q
    setSearchParams(
      {
        ...(q && { q }),
        ...(genre && { genre }),
        ...(year && { year }),
      },
      { replace: true },
    )
  }

  function applyInput() {
    const next = input.trim()
    if (next === query) return
    writeUrl({ q: next, genre, year })
  }

  useEffect(() => {
    const timer = setTimeout(applyInput, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  })

  // Follows URL changes from elsewhere (back, forward, the navbar link). The page's
  // own write arrives late, so comparing it to the input would delete newer typing.
  useEffect(() => {
    if (query === latestQuery.current) return
    latestQuery.current = query
    setInput(query)
  }, [query])

  function handleSubmit(event) {
    event.preventDefault()
    applyInput()
  }

  const isGenreListReady = genreList.status === 'ready'
  const genreOptions = isGenreListReady
    ? withCurrentValue(
        [
          { value: '', label: 'All genres' },
          ...genreList.genres.map(({ id, name }) => ({ value: String(id), label: name })),
        ],
        genre,
        'Unknown genre',
      )
    : [{ value: '', label: 'Loading genres...' }]

  return (
    <>
      <h1 className="text-gradient text-3xl font-bold tracking-tight min-[860px]:text-4xl">Search</h1>

      <form role="search" onSubmit={handleSubmit} className="mt-4 max-w-xl">
        <FormField
          label="Search movies"
          name="q"
          type="search"
          required={false}
          autoComplete="off"
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />

        <div className="mt-4 grid grid-cols-1 items-start gap-4 min-[480px]:grid-cols-2">
          {genreList.status === 'error' ? (
            <div role="alert">
              <p className="text-sm text-error">We couldn&apos;t load genres.</p>
              <button
                type="button"
                onClick={genreList.retry}
                className="mt-2 rounded-md bg-accent px-4 py-2 font-medium text-accent-ink transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none"
              >
                Try again
              </button>
            </div>
          ) : (
            <FilterSelect
              label="Genre"
              value={isGenreListReady ? genre : ''}
              options={genreOptions}
              disabled={!isGenreListReady}
              onChange={(value) => writeUrl({ q: input.trim(), genre: value, year })}
            />
          )}

          <FilterSelect
            label="Release year"
            value={year}
            options={withCurrentValue(YEAR_OPTIONS, year, year)}
            onChange={(value) => writeUrl({ q: input.trim(), genre, year: value })}
          />
        </div>
      </form>

      <div className="mt-8">
        {query || genre || year ? (
          <SearchResults key={JSON.stringify([query, genre, year])} query={query} genre={genre} year={year} />
        ) : (
          <p className="text-muted">Type a movie title or choose a filter to search.</p>
        )}
      </div>
    </>
  )
}

export default SearchPage

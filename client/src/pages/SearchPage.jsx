import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import FormField from '../components/auth/FormField.jsx'
import SearchResults from '../components/movies/SearchResults.jsx'

const DEBOUNCE_MS = 300

function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = (searchParams.get('q') ?? '').trim()
  const [input, setInput] = useState(query)
  const latestQuery = useRef(query)

  function applyInput() {
    const next = input.trim()
    if (next === query) return
    latestQuery.current = next
    setSearchParams(next ? { q: next } : {}, { replace: true })
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

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight min-[860px]:text-4xl">Search</h1>

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
      </form>

      <div className="mt-8">
        {query ? (
          <SearchResults key={query} query={query} />
        ) : (
          <p className="text-muted">Type a movie title to search.</p>
        )}
      </div>
    </>
  )
}

export default SearchPage
